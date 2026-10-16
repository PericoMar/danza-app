// server/http.mjs
// Request plumbing shared by the Vercel functions under /api. Each handler used
// to carry its own copy of this, which is how one of them ended up allowing a
// production origin the site no longer uses.
//
// Lives outside /api on purpose: everything inside that directory becomes a
// route, and this is a module, not an endpoint.

// The only browser origin allowed to call the functions in production. Native
// builds and server-to-server callers send no Origin and are unaffected by CORS.
export const PRODUCTION_ORIGIN = "https://danza-app.com";

function allowedOrigin() {
  return process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : "*";
}

/**
 * Answers the CORS preflight and rejects any verb the handler doesn't serve.
 * Returns true when it has already replied, meaning the handler must return.
 */
export function handledAsPreflightOrWrongMethod(req, res, method = "POST") {
  const methods = `${method}, OPTIONS`;

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin());
  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  if (req.method !== method) {
    res.setHeader("Allow", methods);
    res.status(405).end();
    return true;
  }

  return false;
}

// Same rule as isValidEmail in utils/validation.ts and the audition_emails CHECK.
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Addresses are stored and compared lowercased: A@x.com and a@x.com are one inbox. */
export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

/** An email is only logged as its first characters, never whole. */
export function maskEmail(email) {
  const value = String(email ?? "");
  return value ? `${value.slice(0, 3)}***` : "missing";
}
