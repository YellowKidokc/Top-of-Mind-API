import { google } from "googleapis";
import http from "http";
import { URL } from "url";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
];

const REDIRECT_URI = "http://localhost:3333/oauth2callback";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.VITE_GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // Force to get refresh token
});

console.log("\n🔐 Google Drive OAuth2 Token Generator\n");
console.log("📋 Copy this URL and open it in your browser:\n");
console.log(authUrl);
console.log("\n🔄 Waiting for authorization on http://localhost:3333/oauth2callback\n");

// Start local server to receive callback
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT_URI);
    
    if (url.pathname === "/oauth2callback") {
      const code = url.searchParams.get("code");
      
      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 40px; text-align: center;">
              <h1>✅ Authentication Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);
        
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log("\n✅ Token obtained successfully!\n");
        console.log("📋 Copy this refresh token to your .env.local file:\n");
        console.log(tokens.refresh_token);
        console.log("\nAdd it as:");
        console.log("GOOGLE_PERSONAL_REFRESH_TOKEN=" + tokens.refresh_token);
        console.log("# OR for work account:");
        console.log("GOOGLE_WORK_REFRESH_TOKEN=" + tokens.refresh_token);
        console.log("\n");
        
        server.close();
        process.exit(0);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Error: No authorization code received");
        server.close();
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
    server.close();
    process.exit(1);
  }
});

server.listen(3333, () => {
  console.log("💡 Tip: If you're using a different account, open the URL in an incognito window\n");
});
