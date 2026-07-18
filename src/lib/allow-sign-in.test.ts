import { describe, expect, it } from "vitest";
import { shouldAllowSignIn } from "./allow-sign-in";

describe("shouldAllowSignIn", () => {
  it("admits the owner email on a real OAuth provider", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(
      shouldAllowSignIn({
        provider: "google",
        email: "owner@example.com",
      }),
    ).toBe(true);
  });

  it("denies a non-owner Google account so the user bounces back to /login", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(
      shouldAllowSignIn({
        provider: "google",
        email: "stranger@example.com",
      }),
    ).toBe(false);
  });

  it("admits any session via the test-owner provider (gated by env elsewhere)", () => {
    expect(
      shouldAllowSignIn({
        provider: "test-owner",
        email: "anyone@example.com",
      }),
    ).toBe(true);
  });

  it("admits the test-owner provider even when OWNER_EMAIL is unset", () => {
    delete process.env.OWNER_EMAIL;
    expect(
      shouldAllowSignIn({
        provider: "test-owner",
        email: "anyone@example.com",
      }),
    ).toBe(true);
  });

  it("denies unknown providers", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(
      shouldAllowSignIn({
        provider: "facebook",
        email: "owner@example.com",
      }),
    ).toBe(false);
  });

  it("denies when the email is missing", () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    expect(shouldAllowSignIn({ provider: "google", email: null })).toBe(false);
  });
});