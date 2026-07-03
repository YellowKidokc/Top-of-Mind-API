import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from "path";

// Get project root (parent of server/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, ".env.local") });

import fs from "fs";
import { google } from "googleapis";

/**
 * Google Drive auth helper
 *
 * - Expects .env.local to contain:
 *     GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH=C:\Users\ashra\Google Drive\Emma\secrets\mimetic-science-477016-a1-a9e2c7a0abcf.json
 *
 * - Reads the file from disk (never from pasted env JSON).
 * - Throws helpful errors if missing or malformed.
 */

const serviceAccountPathRaw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPathRaw) {
  throw new Error(
    "Missing GOOGLE_DRIVE_SERVICE_ACCOUNT_PATH in environment. Set it in .env.local"
  );
}

const serviceAccountPath = path.resolve(serviceAccountPathRaw);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Service account JSON file not found at: ${serviceAccountPath}\n` +
      "Make sure the file exists and the path is correct in .env.local"
  );
}

let credentials;
try {
  const raw = fs.readFileSync(serviceAccountPath, "utf8");
  credentials = JSON.parse(raw);
} catch (err) {
  throw new Error(
    `Failed to read or parse service account JSON at ${serviceAccountPath}: ${err.message}`
  );
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

export { auth, drive };
export default auth;
