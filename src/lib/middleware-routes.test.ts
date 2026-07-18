import { describe, expect, it } from "vitest";
import { isPublicRoute } from "./middleware-routes";

describe("isPublicRoute", () => {
  it("lets the login page through without a session", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/login/")).toBe(true);
  });

  it("lets every Auth.js callback through so sign-in can complete", () => {
    expect(isPublicRoute("/api/auth/signin")).toBe(true);
    expect(isPublicRoute("/api/auth/callback/google")).toBe(true);
    expect(isPublicRoute("/api/auth/callback/credentials")).toBe(true);
    expect(isPublicRoute("/api/auth/signout")).toBe(true);
    expect(isPublicRoute("/api/auth/session")).toBe(true);
  });

  it("gates all four sections", () => {
    expect(isPublicRoute("/today")).toBe(false);
    expect(isPublicRoute("/habits")).toBe(false);
    expect(isPublicRoute("/finance")).toBe(false);
    expect(isPublicRoute("/notes")).toBe(false);
  });

  it("gates nested routes under a section", () => {
    expect(isPublicRoute("/today/edit")).toBe(false);
    expect(isPublicRoute("/habits/123")).toBe(false);
  });

  it("gates the root redirect", () => {
    expect(isPublicRoute("/")).toBe(false);
  });

  it("does not leak arbitrary /api routes through the auth gate", () => {
    expect(isPublicRoute("/api/data")).toBe(false);
    expect(isPublicRoute("/api/today")).toBe(false);
  });
});