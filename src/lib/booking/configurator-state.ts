export type VehicleType = "sedan" | "suv" | "truck" | "van" | "luxury" | "boat";
export type ContactMethod = "phone" | "email" | "text";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export interface ConfiguratorState {
  step: number;
  serviceId: string | null;
  vehicleType: VehicleType | null;
  addOnIds: string[];
  vehicleDescription: string;
  notes: string;
  date: string;
  timeOfDay: TimeOfDay | null;
  name: string;
  email: string;
  phone: string;
  contactMethod: ContactMethod | null;
  status: "editing" | "submitting" | "error" | "done";
}

export type ConfiguratorAction =
  | { type: "SET_SERVICE"; serviceId: string }
  | { type: "SET_VEHICLE_TYPE"; vehicleType: VehicleType }
  | { type: "TOGGLE_ADDON"; addOnId: string }
  | { type: "SET_FIELD"; field: keyof ConfiguratorState; value: string }
  | { type: "SET_CONTACT_METHOD"; method: ContactMethod }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE" }
  | { type: "SUBMIT_ERROR" }
  | { type: "RESET" };

export const TOTAL_STEPS = 7; // service, vehicle type, add-ons, details, date/time, contact, review

export const initialConfiguratorState: ConfiguratorState = {
  step: 1,
  serviceId: null,
  vehicleType: null,
  addOnIds: [],
  vehicleDescription: "",
  notes: "",
  date: "",
  timeOfDay: null,
  name: "",
  email: "",
  phone: "",
  contactMethod: null,
  status: "editing",
};

export function configuratorReducer(state: ConfiguratorState, action: ConfiguratorAction): ConfiguratorState {
  switch (action.type) {
    case "SET_SERVICE":
      return { ...state, serviceId: action.serviceId };
    case "SET_VEHICLE_TYPE":
      return { ...state, vehicleType: action.vehicleType };
    case "TOGGLE_ADDON":
      return {
        ...state,
        addOnIds: state.addOnIds.includes(action.addOnId)
          ? state.addOnIds.filter((id) => id !== action.addOnId)
          : [...state.addOnIds, action.addOnId],
      };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_CONTACT_METHOD":
      return { ...state, contactMethod: action.method };
    case "GO_TO_STEP":
      return { ...state, step: action.step };
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "SUBMIT_START":
      return { ...state, status: "submitting" };
    case "SUBMIT_DONE":
      return { ...state, status: "done" };
    case "SUBMIT_ERROR":
      return { ...state, status: "error" };
    case "RESET":
      return initialConfiguratorState;
    default:
      return state;
  }
}

/** Whether the current step's required input is satisfied — gates the Continue button. */
export function isStepValid(state: ConfiguratorState): boolean {
  switch (state.step) {
    case 1:
      return Boolean(state.serviceId);
    case 2:
      return Boolean(state.vehicleType);
    case 3:
      return true; // add-ons are optional
    case 4:
      return state.vehicleDescription.trim().length > 0;
    case 5:
      return Boolean(state.date && state.timeOfDay);
    case 6:
      return Boolean(
        state.name.trim() &&
          state.phone.trim() &&
          state.contactMethod &&
          (state.contactMethod !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)),
      );
    case 7:
      return true;
    default:
      return false;
  }
}

/** A short, non-persisted client-side reference — clearly not a real booking ID from a
 * system of record (see the preview-mode messaging in booking-configurator.tsx). */
export function generateReference(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
