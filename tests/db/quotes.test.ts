/**
 * Proves the quote rules in supabase/migrations/0008_quotes.sql against real Postgres (PGlite):
 * the database computes every line total, subtotal and total; an accepted quote keeps its prices;
 * scheduling turns a quote into exactly one appointment and one job; and only staff can see or
 * change quotes.
 *
 *   npm run test:db
 */
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { PGlite } from "@electric-sql/pglite";
import { asRole, migratedDatabase } from "./database";

type Row = Record<string, unknown>;
type DatabaseError = { code?: string; message: string };

let db: PGlite;

before(async () => {
  db = await migratedDatabase();
});

after(async () => {
  await db.close();
});

async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T> {
  const { rows } = await db.query<T>(sql, params);
  return rows[0];
}

async function sqlError(sql: string, params: unknown[] = []): Promise<DatabaseError> {
  try {
    await db.query(sql, params);
  } catch (error) {
    return error as DatabaseError;
  }
  return assert.fail(`Expected the database to reject: ${sql}`);
}

async function newLead(customerId: string | null = null) {
  return one<{ id: string }>(
    `insert into leads (name, phone, customer_id) values ('Test Lead', '5550001111', $1) returning id`,
    [customerId],
  );
}

async function newCustomer() {
  return one<{ id: string }>(
    `insert into customers (name, street, city, state, postal_code)
     values ('Pat Example', '1 Main St', 'Lakewood', 'OH', '44107') returning id`,
  );
}

async function newQuote(leadId: string, tax = 0) {
  return one<{ id: string; quote_number: string }>(
    `insert into quotes (lead_id, tax) values ($1, $2) returning id, quote_number`,
    [leadId, tax],
  );
}

async function addItem(quoteId: string, description: string, quantity: number, unitPrice: number) {
  return one<{ id: string; line_total: string }>(
    `insert into quote_items (quote_id, description, quantity, unit_price) values ($1, $2, $3, $4) returning id, line_total`,
    [quoteId, description, quantity, unitPrice],
  );
}

async function amounts(quoteId: string) {
  const quote = await one<{ subtotal: string; tax: string; total: string }>(
    `select subtotal, tax, total from quotes where id = $1`,
    [quoteId],
  );
  return { subtotal: Number(quote.subtotal), tax: Number(quote.tax), total: Number(quote.total) };
}

async function schedule(quoteId: string, startsAt = "2026-10-02T09:00", tenant = "all-things-fresh") {
  const { result } = await one<{ result: { appointment_id: string; job_id: string; customer_id: string } }>(
    `select schedule_quote($1, $2, $3, null) as result`,
    [tenant, quoteId, startsAt],
  );
  return result;
}

/** A priced quote ($100 + $8 tax) whose lead has already been converted to a customer. */
async function readyQuote() {
  const customer = await newCustomer();
  const lead = await newLead(customer.id);
  const quote = await newQuote(lead.id, 8);
  const item = await addItem(quote.id, "Full detail", 1, 100);
  return { customer, lead, quote, item };
}

describe("quote totals", () => {
  test("numbers each quote and ignores a subtotal sent by the client", async () => {
    const lead = await newLead();
    const quote = await one<Row>(`insert into quotes (lead_id, subtotal, tax) values ($1, 999, 5) returning *`, [lead.id]);
    assert.match(String(quote.quote_number), /^Q-\d{4,}$/);
    assert.deepEqual(await amounts(String(quote.id)), { subtotal: 0, tax: 5, total: 5 });
  });

  test("refuses writes to the total and line totals", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    const item = await addItem(quote.id, "Wash", 1, 40);
    assert.ok(await sqlError(`update quotes set total = 1 where id = $1`, [quote.id]));
    assert.ok(await sqlError(`update quote_items set line_total = 1 where id = $1`, [item.id]));
  });

  test("line total is quantity × unit price, rounded to the cent", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    assert.equal(Number((await addItem(quote.id, "Wax", 1.5, 20)).line_total), 30);
    assert.equal(Number((await addItem(quote.id, "Mats", 3, 33.33)).line_total), 99.99);
    assert.equal(Number((await addItem(quote.id, "Trim", 0.33, 10.01)).line_total), 3.3);
  });

  test("subtotal follows every item insert, edit and delete, and total adds the tax", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id, 5);
    const interior = await addItem(quote.id, "Interior", 2, 50);
    const wax = await addItem(quote.id, "Wax", 1.5, 20);
    assert.deepEqual(await amounts(quote.id), { subtotal: 130, tax: 5, total: 135 });

    await db.query(`update quote_items set quantity = 3 where id = $1`, [wax.id]);
    assert.deepEqual(await amounts(quote.id), { subtotal: 160, tax: 5, total: 165 });

    await db.query(`delete from quote_items where id = $1`, [interior.id]);
    assert.deepEqual(await amounts(quote.id), { subtotal: 60, tax: 5, total: 65 });
  });

  test("tax is the only amount typed by hand", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    await addItem(quote.id, "Interior", 1, 160);
    await db.query(`update quotes set subtotal = 1, tax = 10.5 where id = $1`, [quote.id]);
    assert.deepEqual(await amounts(quote.id), { subtotal: 160, tax: 10.5, total: 170.5 });
  });

  test("moving an item to another quote updates both quotes", async () => {
    const lead = await newLead();
    const from = await newQuote(lead.id);
    const to = await newQuote(lead.id);
    const item = await addItem(from.id, "Wax", 1, 60);
    await db.query(`update quote_items set quote_id = $1 where id = $2`, [to.id, item.id]);
    assert.equal((await amounts(from.id)).subtotal, 0);
    assert.equal((await amounts(to.id)).subtotal, 60);
  });

  test("rejects negative prices, zero quantities and negative tax", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    assert.equal((await sqlError(`insert into quote_items (quote_id, description, unit_price) values ($1, 'Refund', -5)`, [quote.id])).code, "23514");
    assert.equal((await sqlError(`insert into quote_items (quote_id, description, quantity, unit_price) values ($1, 'None', 0, 5)`, [quote.id])).code, "23514");
    assert.equal((await sqlError(`update quotes set tax = -1 where id = $1`, [quote.id])).code, "23514");
  });

  test("deleting a quote deletes its line items", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    await addItem(quote.id, "Wash", 1, 40);
    await db.query(`delete from quotes where id = $1`, [quote.id]);
    const { count } = await one<{ count: number }>(`select count(*)::int as count from quote_items where quote_id = $1`, [quote.id]);
    assert.equal(count, 0);
  });
});

describe("scheduling an accepted quote", () => {
  test("creates one appointment and one job at the customer's address and accepts the quote", async () => {
    const { customer, quote } = await readyQuote();
    const result = await schedule(quote.id, "2026-10-02T09:00");

    const saved = await one<Row>(`select status, customer_id, appointment_id, job_id from quotes where id = $1`, [quote.id]);
    assert.deepEqual(saved, { status: "accepted", customer_id: customer.id, appointment_id: result.appointment_id, job_id: result.job_id });

    const appointment = await one<Row>(`select customer_id, status, address, notes from appointments where id = $1`, [result.appointment_id]);
    assert.deepEqual(appointment, { customer_id: customer.id, status: "scheduled", address: "1 Main St, Lakewood, OH 44107", notes: `Quote ${quote.quote_number}` });

    const job = await one<Row>(`select customer_id, appointment_id, status, scheduled_date::text as date from jobs where id = $1`, [result.job_id]);
    assert.deepEqual(job, { customer_id: customer.id, appointment_id: result.appointment_id, status: "scheduled", date: "2026-10-02" });
  });

  test("scheduling the same quote twice fails and creates nothing more", async () => {
    const { customer, quote } = await readyQuote();
    await schedule(quote.id);
    const error = await sqlError(`select schedule_quote('all-things-fresh', $1, '2026-10-03T09:00', null)`, [quote.id]);
    assert.equal(error.code, "55000");
    assert.match(error.message, /already been accepted and scheduled/);
    const { jobs, appointments } = await one<{ jobs: number; appointments: number }>(
      `select (select count(*)::int from jobs where customer_id = $1) as jobs,
              (select count(*)::int from appointments where customer_id = $1) as appointments`,
      [customer.id],
    );
    assert.deepEqual({ jobs, appointments }, { jobs: 1, appointments: 1 });
  });

  test("needs a customer: a lead must be converted first", async () => {
    const lead = await newLead();
    const quote = await newQuote(lead.id);
    const error = await sqlError(`select schedule_quote('all-things-fresh', $1, '2026-10-02T09:00', null)`, [quote.id]);
    assert.equal(error.code, "55000");
    assert.match(error.message, /Convert the lead/);
  });

  test("an accepted quote's prices are locked, but its notes and descriptions are not", async () => {
    const { quote, item } = await readyQuote();
    await schedule(quote.id);
    assert.equal((await sqlError(`insert into quote_items (quote_id, description, unit_price) values ($1, 'Extra', 10)`, [quote.id])).code, "55000");
    assert.equal((await sqlError(`update quote_items set unit_price = 1 where id = $1`, [item.id])).code, "55000");
    assert.equal((await sqlError(`delete from quote_items where id = $1`, [item.id])).code, "55000");
    assert.equal((await sqlError(`update quotes set tax = 0 where id = $1`, [quote.id])).code, "55000");
    await db.query(`update quote_items set description = 'Full detail + sealant' where id = $1`, [item.id]);
    await db.query(`update quotes set notes = 'Gate code 1234' where id = $1`, [quote.id]);
    assert.deepEqual(await amounts(quote.id), { subtotal: 100, tax: 8, total: 108 });
  });

  test("a scheduled quote cannot be moved out of accepted", async () => {
    const { quote } = await readyQuote();
    await schedule(quote.id);
    for (const status of ["draft", "sent", "declined", "expired"]) {
      assert.equal((await sqlError(`update quotes set status = $2 where id = $1`, [quote.id, status])).code, "55000");
    }
  });

  test("deleting the job unlinks it from the quote", async () => {
    const { quote } = await readyQuote();
    const result = await schedule(quote.id);
    await db.query(`delete from jobs where id = $1`, [result.job_id]);
    const saved = await one<Row>(`select status, job_id from quotes where id = $1`, [quote.id]);
    assert.deepEqual(saved, { status: "accepted", job_id: null });
  });

  test("declined and expired quotes cannot be scheduled", async () => {
    for (const status of ["declined", "expired"]) {
      const { quote } = await readyQuote();
      await db.query(`update quotes set status = $2 where id = $1`, [quote.id, status]);
      const error = await sqlError(`select schedule_quote('all-things-fresh', $1, '2026-10-02T09:00', null)`, [quote.id]);
      assert.equal(error.code, "55000");
    }
  });

  test("only finds quotes in the caller's tenant", async () => {
    const { quote } = await readyQuote();
    const error = await sqlError(`select schedule_quote('other-tenant', $1, '2026-10-02T09:00', null)`, [quote.id]);
    assert.equal(error.code, "P0002");
  });
});

describe("who can see and change quotes", () => {
  let managerId: string;
  let editorId: string;

  before(async () => {
    const staff = async (email: string, role: string) => {
      const user = await one<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [email]);
      await db.query(`update profiles set role = $2, active = true where id = $1`, [user.id, role]);
      return user.id;
    };
    managerId = await staff("manager@example.test", "manager");
    editorId = await staff("editor@example.test", "editor");
  });

  test("the anon key can read no quotes, line items, leads or customers", async () => {
    await readyQuote();
    await asRole(db, "anon", null, async () => {
      for (const table of ["quotes", "quote_items", "leads", "customers"]) {
        const { rows } = await db.query(`select * from ${table}`);
        assert.equal(rows.length, 0, `anon read ${table}`);
      }
    });
  });

  test("the anon key cannot create quotes or schedule them", async () => {
    const { lead, quote } = await readyQuote();
    await asRole(db, "anon", null, async () => {
      assert.ok(await sqlError(`insert into quotes (lead_id) values ($1)`, [lead.id]));
      assert.equal((await sqlError(`select schedule_quote('all-things-fresh', $1, now(), null)`, [quote.id])).code, "42501");
    });
  });

  test("an editor can read quotes but not change or schedule them", async () => {
    const { lead, quote } = await readyQuote();
    await asRole(db, "authenticated", editorId, async () => {
      const { rows } = await db.query(`select id from quotes where id = $1`, [quote.id]);
      assert.equal(rows.length, 1);
      assert.ok(await sqlError(`insert into quotes (lead_id) values ($1)`, [lead.id]));
      assert.equal((await sqlError(`select schedule_quote('all-things-fresh', $1, now(), null)`, [quote.id])).code, "42501");
    });
  });

  test("a manager can write quotes, and the totals are still computed", async () => {
    const customer = await newCustomer();
    const total = await asRole(db, "authenticated", managerId, async () => {
      const quote = await one<{ id: string }>(`insert into quotes (customer_id, tax) values ($1, 2) returning id`, [customer.id]);
      await db.query(`insert into quote_items (quote_id, description, unit_price) values ($1, 'Wash', 40)`, [quote.id]);
      return (await amounts(quote.id)).total;
    });
    assert.equal(total, 42);
  });
});
