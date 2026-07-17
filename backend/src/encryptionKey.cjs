const KEY_BYTES = 32;

function parseTokenEncryptionKey(value) {
  if (typeof value !== "string" || !value) return { valid: false, reason: "fehlt" };
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) return { valid: false, reason: "muss kanonisches Base64 mit 44 Zeichen sein" };
  let bytes;
  try { bytes = Buffer.from(value, "base64"); } catch { return { valid: false, reason: "ist kein gültiges Base64" }; }
  if (bytes.length !== KEY_BYTES || bytes.toString("base64") !== value) return { valid: false, reason: "muss genau 32 Byte dekodieren" };
  return { valid: true, bytes };
}

function tokenEncryptionKeyError(result) {
  return `ATHLETEOS_TOKEN_ENCRYPTION_KEY ${result.reason}. Erwartet wird Base64 eines kryptografisch zufälligen 32-Byte-Schlüssels. Backend wurde nicht gestartet.`;
}

module.exports = { KEY_BYTES, parseTokenEncryptionKey, tokenEncryptionKeyError };
