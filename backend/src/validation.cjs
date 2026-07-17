function requireUserId(request) {
  const value = request.headers["x-athleteos-user-id"];
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,80}$/.test(value)) {
    const error = new Error("Eine gültige Nutzerkennung ist erforderlich.");
    error.statusCode = 401;
    throw error;
  }
  return value;
}

function validateMobileRedirect(value, allowedRedirect) {
  if (!value || value === allowedRedirect) return allowedRedirect;
  try {
    const url = new URL(value);
    const privateIpv4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    const exactPath = url.pathname === "/--/integration/strava" || url.pathname === "/integration/strava";
    const validPort = !url.port || (Number(url.port) > 0 && Number(url.port) <= 65535);
    return ["exp:", "exps:"].includes(url.protocol) && privateIpv4 && exactPath && validPort
      ? value
      : null;
  } catch {
    return null;
  }
}

function parseJson(request, maximumBytes = 16384) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > maximumBytes) request.destroy();
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(Object.assign(new Error("Ungültiger JSON-Body."), { statusCode: 400 })); }
    });
    request.on("error", reject);
  });
}

module.exports = { parseJson, requireUserId, validateMobileRedirect };
