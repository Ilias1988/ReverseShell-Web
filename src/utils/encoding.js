/**
 * Encoding utilities for reverse shell payloads
 * Mirrors the Python version's encoding options:
 * - None (raw)
 * - Base64
 * - URL Encode
 * - Double URL Encode
 */

/**
 * Encode a string to Base64
 * Uses TextEncoder for proper UTF-8 handling
 * @param {string} str - The string to encode
 * @returns {string} Base64 encoded string
 */
export function encodeBase64(str) {
  try {
    // Handle UTF-8 characters properly
    const bytes = new TextEncoder().encode(str);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary);
  } catch (e) {
    // Fallback for simple ASCII
    return btoa(str);
  }
}

/**
 * URL encode a string
 * @param {string} str - The string to encode
 * @returns {string} URL encoded string
 */
export function encodeURL(str) {
  return encodeURIComponent(str);
}

/**
 * Double URL encode a string
 * @param {string} str - The string to encode
 * @returns {string} Double URL encoded string
 */
export function encodeDoubleURL(str) {
  return encodeURIComponent(encodeURIComponent(str));
}

/**
 * Apply the selected encoding to a payload string
 * @param {string} payload - The raw payload string
 * @param {string} encoding - The encoding type: "None" | "Base64" | "URL" | "Double URL"
 * @returns {string} The encoded payload
 */
export function applyEncoding(payload, encoding) {
  switch (encoding) {
    case 'Base64':
      return encodeBase64(payload);
    case 'URL':
      return encodeURL(payload);
    case 'Double URL':
      return encodeDoubleURL(payload);
    case 'None':
    default:
      return payload;
  }
}

/**
 * Replace {ip} and {port} placeholders in a payload template
 * @param {string} template - The payload template with {ip} and {port} placeholders
 * @param {string} ip - The IP address to inject
 * @param {string} port - The port number to inject
 * @returns {string} The payload with placeholders replaced
 */
export function injectPayloadValues(template, ip, port) {
  return template
    .replaceAll('{ip}', ip)
    .replaceAll('{port}', port);
}

/**
 * Copy text to clipboard using the Clipboard API
 * Falls back to legacy method if API is not available
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} Whether the copy was successful
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts (e.g., HTTP)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
