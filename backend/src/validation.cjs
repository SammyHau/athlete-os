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
  return !value || value === allowedRedirect ? allowedRedirect : null;
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
