"use client";

import { useEffect, useReducer, useState } from "react";
import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import {
  configuratorReducer,
  initialConfiguratorState,
  isStepValid,
  generateReference,
  TOTAL_STEPS,
} from "@/lib/booking/configurator-state";
import { track } from "@/lib/analytics/track";
import { ProgressIndicator } from "./progress-indicator";
import { StepService } from "./step-service";
import { StepVehicleType } from "./step-vehicle-type";
import { StepAddOns } from "./step-addons";
import { StepDetails } from "./step-details";
import { StepDateTime } from "./step-datetime";
import { StepContact } from "./step-contact";
import { StepReview } from "./step-review";

export function BookingConfigurator({
  tenant,
  dict,
  initialServiceId,
  onClose,
}: {
  tenant: TenantConfig;
  dict: Dictionary;
  initialServiceId?: string;
  onClose?: () => void;
}) {
  const [state, dispatch] = useReducer(configuratorReducer, {
    ...initialConfiguratorState,
    serviceId: initialServiceId ?? null,
  });
  const [website, setWebsite] = useState("");

  const isConfigured = Boolean(tenant.booking.webhookUrl);

  useEffect(() => {
    track("booking_step", { step: state.step });
  }, [state.step]);

  async function handleSubmit() {
    dispatch({ type: "SUBMIT_START" });
    const reference = generateReference();

    if (isConfigured) {
      try {
        const response = await fetch("/api/booking/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...state, reference, website }),
        });

        if (!response.ok) {
          throw new Error(`Booking relay returned ${response.status}`);
        }
      } catch {
        track("booking_error", { reference });
        dispatch({ type: "SUBMIT_ERROR" });
        return;
      }
    }

    track("booking_complete", { reference, configured: isConfigured });
    dispatch({ type: "SUBMIT_DONE" });
  }

  if (state.status === "done") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-success)]/12 text-[var(--color-success)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="mb-2 text-title font-bold">
          {isConfigured ? dict.configurator.successConfiguredTitle : dict.configurator.successPreviewTitle}
        </h3>
        <p className="mx-auto mb-5 max-w-[42ch] text-small leading-relaxed text-[var(--color-ink-muted)]">
          {isConfigured ? dict.configurator.successConfiguredBody : dict.configurator.successPreviewBody}
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET" })}
          className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] px-5 text-small font-semibold hover:bg-[var(--color-contrast-raised)]"
        >
          {dict.configurator.startOver}
        </button>
      </div>
    );
  }

  const valid = isStepValid(state);

  return (
    <div>
      {onClose && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-body font-bold">{dict.configurator.title}</h2>
          <button type="button" onClick={onClose} aria-label={dict.configurator.close} className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-ink-faint)] hover:bg-[var(--color-contrast-raised)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}

      {!isConfigured && (
        <div className="mb-5 rounded-[var(--radius-control)] border border-dashed border-[var(--color-border)] bg-[var(--color-contrast-raised)] px-3.5 py-2.5 text-caption leading-relaxed text-[var(--color-ink-faint)]">
          {dict.configurator.previewBanner}
        </div>
      )}

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <ProgressIndicator step={state.step} dict={dict} />

      <div aria-live="polite">
        {state.step === 1 && <StepService tenant={tenant} dict={dict} selected={state.serviceId} onSelect={(serviceId) => dispatch({ type: "SET_SERVICE", serviceId })} />}
        {state.step === 2 && <StepVehicleType dict={dict} selected={state.vehicleType} onSelect={(vehicleType) => dispatch({ type: "SET_VEHICLE_TYPE", vehicleType })} />}
        {state.step === 3 && (
          <StepAddOns
            tenant={tenant}
            dict={dict}
            primaryServiceId={state.serviceId}
            selected={state.addOnIds}
            onToggle={(addOnId) => dispatch({ type: "TOGGLE_ADDON", addOnId })}
          />
        )}
        {state.step === 4 && (
          <StepDetails
            dict={dict}
            vehicleDescription={state.vehicleDescription}
            notes={state.notes}
            onChange={(field, value) => dispatch({ type: "SET_FIELD", field, value })}
          />
        )}
        {state.step === 5 && (
          <StepDateTime
            dict={dict}
            date={state.date}
            timeOfDay={state.timeOfDay}
            onDateChange={(value) => dispatch({ type: "SET_FIELD", field: "date", value })}
            onTimeChange={(timeOfDay) => dispatch({ type: "SET_FIELD", field: "timeOfDay", value: timeOfDay })}
          />
        )}
        {state.step === 6 && (
          <StepContact
            dict={dict}
            name={state.name}
            email={state.email}
            phone={state.phone}
            contactMethod={state.contactMethod}
            onFieldChange={(field, value) => dispatch({ type: "SET_FIELD", field, value })}
            onMethodChange={(method) => dispatch({ type: "SET_CONTACT_METHOD", method })}
          />
        )}
        {state.step === 7 && <StepReview tenant={tenant} dict={dict} state={state} onEditStep={(step) => dispatch({ type: "GO_TO_STEP", step })} />}
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 px-4 py-3 text-small text-[var(--color-danger)]"
        >
          {dict.configurator.submitError}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between border-t border-[var(--color-border)] pt-5">
        <button
          type="button"
          onClick={() => dispatch({ type: "BACK" })}
          disabled={state.step === 1}
          className="h-10 rounded-[var(--radius-control)] px-4 text-small font-semibold text-[var(--color-ink-muted)] disabled:opacity-0"
        >
          {dict.configurator.back}
        </button>

        {state.step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "NEXT" })}
            disabled={!valid}
            className="h-11 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-7 text-small font-semibold text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {dict.configurator.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state.status === "submitting"}
            className="h-11 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-7 text-small font-semibold text-[var(--color-canvas)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {state.status === "submitting" ? dict.configurator.submitting : dict.configurator.submit}
          </button>
        )}
      </div>
    </div>
  );
}
