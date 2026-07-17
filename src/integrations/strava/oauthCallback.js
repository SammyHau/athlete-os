export function parseStravaCallback(url) {
  let callbackUrl;
  try {
    callbackUrl = new URL(url);
  } catch {
    return null;
  }
  if (!callbackUrl.pathname.endsWith("/integration/strava") && callbackUrl.pathname !== "/strava") return null;
  const status = callbackUrl.searchParams.get("status");
  return ["connected", "cancelled", "error"].includes(status) ? status : "error";
}
