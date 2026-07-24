import type { OrderFormFieldErrors } from "@/lib/orders/schema";

export interface SubmitOrderState {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: OrderFormFieldErrors;
}

export const initialSubmitOrderState: SubmitOrderState = { status: "idle" };
