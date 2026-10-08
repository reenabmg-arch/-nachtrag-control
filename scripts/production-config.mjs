/** Validate deployment settings without printing any credential values. */
export function productionConfig(env) {
  const rawOrigin = env.APP_ORIGIN || env.RENDER_EXTERNAL_URL;
  if (!rawOrigin)
    throw new Error("APP_ORIGIN or RENDER_EXTERNAL_URL is required.");
  const url = new URL(rawOrigin);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error(
      "APP_ORIGIN must be an origin without credentials, path, query or fragment.",
    );
  const local =
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    env.ALLOW_INSECURE_LOCAL === "1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new Error("Production requires HTTPS.");
  for (const name of ["HOST_SECRET", "SCHEDULER_SECRET"]) {
    if (!env[name] || env[name].length < 32)
      throw new Error(`${name} must contain at least 32 characters.`);
  }
  if (env.RENDER === "true" && !env.DATABASE_URL)
    throw new Error(
      "Render requires persistent PostgreSQL through DATABASE_URL.",
    );
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid PORT.");
  return { origin: url.origin, port };
}
