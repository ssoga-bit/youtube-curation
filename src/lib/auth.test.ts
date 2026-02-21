import { describe, it, expect } from "vitest";
import { isAdmin } from "./auth";

describe("isAdmin", () => {
  it("returns true for admin session", async () => {
    const session = { user: { role: "admin", id: "1", email: "a@b.com" } };
    expect(await isAdmin(session)).toBe(true);
  });

  it("returns false for user session", async () => {
    const session = { user: { role: "user", id: "1", email: "a@b.com" } };
    expect(await isAdmin(session)).toBe(false);
  });

  it("returns false for null session", async () => {
    expect(await isAdmin(null)).toBe(false);
  });

  it("returns false for undefined session", async () => {
    expect(await isAdmin(undefined)).toBe(false);
  });

  it("returns false for session without user", async () => {
    expect(await isAdmin({})).toBe(false);
  });

  it("returns false for session without role", async () => {
    const session = { user: { id: "1" } };
    expect(await isAdmin(session)).toBe(false);
  });
});
