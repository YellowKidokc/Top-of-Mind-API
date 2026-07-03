import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  throw new Error("Missing Google Drive OAuth credentials from environment variables.");
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// Create Drive API client
const drive = google.drive({ version: "v3", auth: oauth2Client });

export { oauth2Client, drive };
export default drive;
