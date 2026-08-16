import type { KyResponse } from "ky";
import { describe, expect, it } from "vitest";
import { extractErrorMessage, parseUpdatePasswordParams } from "./auth";

describe("parseUpdatePasswordParams", () => {
  it("lee token y email de la query string", () => {
    expect(parseUpdatePasswordParams("?token=abc123&email=user%40inmova.test")).toEqual({
      token: "abc123",
      email: "user@inmova.test",
    });
  });

  it("devuelve null para lo que falte", () => {
    expect(parseUpdatePasswordParams("")).toEqual({ token: null, email: null });
    expect(parseUpdatePasswordParams("?token=abc123")).toEqual({
      token: "abc123",
      email: null,
    });
  });

  it("funciona sin el '?' inicial (URLSearchParams lo tolera)", () => {
    expect(parseUpdatePasswordParams("token=abc&email=x@y.com")).toEqual({
      token: "abc",
      email: "x@y.com",
    });
  });
});

// Mock mínimo de KyResponse: solo lo que usa extractErrorMessage (.json()).
const mockResponse = (body: unknown): KyResponse =>
  ({
    json: async () => body,
  }) as unknown as KyResponse;

describe("extractErrorMessage", () => {
  it("devuelve el message del body si esta presente", async () => {
    const response = mockResponse({ message: "Este link no es válido o venció." });
    await expect(extractErrorMessage(response, "fallback")).resolves.toBe(
      "Este link no es válido o venció.",
    );
  });

  it("devuelve el fallback si el body no tiene message", async () => {
    const response = mockResponse({ errors: { email: ["algo"] } });
    await expect(extractErrorMessage(response, "fallback")).resolves.toBe("fallback");
  });

  it("devuelve el fallback si el body no es JSON parseable", async () => {
    const response = {
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as KyResponse;

    await expect(extractErrorMessage(response, "fallback")).resolves.toBe("fallback");
  });
});
