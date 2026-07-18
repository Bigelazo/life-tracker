import { describe, expect, it } from "vitest";
import { isOwnerEmail, ownerEmail } from "./allowlist";

describe("ownerEmail", () => {
  it("reads the allowlisted email from OWNER_EMAIL", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(ownerEmail()).toBe("owner@example.com");
  });

  it("returns null when OWNER_EMAIL is unset", () => {
    delete process.env.OWNER_EMAIL;
    expect(ownerEmail()).toBeNull();
  });

  it("trims surrounding whitespace from the env var", () => {
    process.env.OWNER_EMAIL = "  owner@example.com  ";
    expect(ownerEmail()).toBe("owner@example.com");
  });
});

describe("isOwnerEmail", () => {
  it("matches the allowlisted email case-insensitively", () => {
    process.env.OWNER_EMAIL = "Owner@Example.com";
    expect(isOwnerEmail("owner@example.com")).toBe(true);
    expect(isOwnerEmail("OWNER@EXAMPLE.COM")).toBe(true);
  });

  it("trims the candidate email before comparing", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(isOwnerEmail("  owner@example.com  ")).toBe(true);
  });

  it("rejects emails that are not the owner", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(isOwnerEmail("intruder@example.com")).toBe(false);
  });

  it("rejects everything when no owner email is configured", () => {
    delete process.env.OWNER_EMAIL;
    expect(isOwnerEmail("owner@example.com")).toBe(false);
  });

  it("rejects null and empty candidates", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(isOwnerEmail(null)).toBe(false);
    expect(isOwnerEmail("")).toBe(false);
  });
});