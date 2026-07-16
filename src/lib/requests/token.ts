import { randomBytes } from "node:crypto";

/**
 * Manage-link helpers. Kept in their own module so both the create path and the
 * manage path can use them without importing each other.
 */

/** Creates an unguessable, URL-safe token for a customer's manage link. */
export function createManageToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Absolute URL the customer uses to reschedule or cancel their booking. */
export function manageUrlFor(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/termin/${token}`;
}
