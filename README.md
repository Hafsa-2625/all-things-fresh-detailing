# All Things Fresh: website and operations console

Next.js 16 + React 19 + Supabase. Public marketing site for a mobile car-detailing business, plus
an `/admin` console for leads, customers, jobs, scheduling and content.

**Candidates: start with [`ASSIGNMENT.md`](ASSIGNMENT.md)**, then read [`CLAUDE.md`](CLAUDE.md)
(design-freeze rules).

```bash
npm ci
cp .env.example .env.local
npm run dev        # http://localhost:3000 (admin at /admin)
```

Without Supabase credentials, development stores records in `.data/atf-local-store.json`.

Architecture notes: [`docs/architecture.md`](docs/architecture.md). SEO system:
[`docs/seo-system.md`](docs/seo-system.md).
