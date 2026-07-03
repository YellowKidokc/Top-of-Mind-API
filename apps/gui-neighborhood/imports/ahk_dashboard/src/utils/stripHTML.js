/**
 * Strip HTML tags and return clean text
 * @param {string} html - HTML string to clean
 * @returns {string} Plain text without HTML tags
 */
export default function stripHTML(html) {
  if (!html) return "";
  
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
