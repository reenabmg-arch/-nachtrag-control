import { describe, it, expect } from "vitest";
import { productionConfig } from "../scripts/production-config.mjs";
const secrets = {
  HOST_SECRET: "test-host-secret-at-least-32-characters",
  SCHEDULER_SECRET: "test-worker-secret-at-least-32-characters",
};
describe("Production deployment configuration", () => {
  it("derives canonical HTTPS origin from Render without user-entered domains", () => {
    expect(
      productionConfig({
        ...secrets,
        RENDER: "true",
        RENDER_EXTERNAL_URL: "https://nachtrag-example.onrender.com",
        DATABASE_URL: "postgresql://test",
        PORT: "10000",
      }),
    ).toEqual({ origin: "https://nachtrag-example.onrender.com", port: 10000 });
  });
  it("fails closed on missing production database, weak secrets and insecure public origins", () => {
    expect(() =>
      productionConfig({
        ...secrets,
        RENDER: "true",
        APP_ORIGIN: "https://example.com",
      }),
    ).toThrow("PostgreSQL");
    expect(() =>
      productionConfig({
        ...secrets,
        APP_ORIGIN: "http://example.com",
        ALLOW_INSECURE_LOCAL: "1",
      }),
    ).toThrow("HTTPS");
    expect(() =>
      productionConfig({
        ...secrets,
        APP_ORIGIN: "https://example.com",
        HOST_SECRET: "short",
      }),
    ).toThrow("HOST_SECRET");
  });
  it("rejects credential-bearing origins and invalid ports, permits explicit loopback tests", () => {
    expect(() =>
      productionConfig({
        ...secrets,
        APP_ORIGIN: "https://user:password@example.com",
      }),
    ).toThrow("origin");
    expect(() =>
      productionConfig({
        ...secrets,
        APP_ORIGIN: "https://example.com",
        PORT: "0",
      }),
    ).toThrow("PORT");
    expect(
      productionConfig({
        ...secrets,
        APP_ORIGIN: "http://localhost:3200",
        ALLOW_INSECURE_LOCAL: "1",
        PORT: "3200",
      }).port,
    ).toBe(3200);
  });
});
