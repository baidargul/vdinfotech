import "server-only";

import { cookies, headers } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE = "vd_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

function configuredSecureCookieValue() {
  const value = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (!value || value === "auto") return null;
  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error('SESSION_COOKIE_SECURE must be "auto", "true", or "false".');
}

function protocolFromUrl(value: string | null) {
  if (!value) return null;

  try {
    return new URL(value).protocol;
  } catch {
    return null;
  }
}

async function shouldUseSecureCookie() {
  const configured = configuredSecureCookieValue();
  if (configured !== null) return configured;

  const requestHeaders = await headers();
  const requestProtocol =
    protocolFromUrl(requestHeaders.get("origin")) ??
    protocolFromUrl(requestHeaders.get("referer"));
  if (requestProtocol) return requestProtocol === "https:";

  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    .trim()
    .toLowerCase();
  if (forwardedProtocol === "http" || forwardedProtocol === "https") {
    return forwardedProtocol === "https";
  }

  const siteProtocol = protocolFromUrl(process.env.NEXT_PUBLIC_SITE_URL ?? null);
  if (siteProtocol) return siteProtocol === "https:";

  return process.env.NODE_ENV === "production";
}

export function assertSessionConfigured() {
  getSessionKey();
  configuredSecureCookieValue();
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: await shouldUseSecureCookie(),
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    return typeof payload.sub === "string"
      ? { userId: payload.sub }
      : null;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
