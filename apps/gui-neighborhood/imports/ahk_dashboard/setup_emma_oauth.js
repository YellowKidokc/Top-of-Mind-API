// setup_emma_oauth.js - Semi-automated Emma OAuth Setup
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🚀 Emma Google Drive OAuth Setup Assistant\n");
console.log("=" .repeat(60));

// Step 1: Verify .env.local exists
console.log("\n📋 Step 1: Verifying environment configuration...");
const envPath = path.join(__dirname, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found!");
  process.exit(1);
}

// Load and parse .env.local
dotenv.config({ path: envPath });
const envContent = fs.readFileSync(envPath, "utf8");

// Step 2: Check OAuth credentials
console.log("✅ .env.local found");
console.log("\n🔑 Step 2: Checking OAuth credentials...");

const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
const personalToken = process.env.GOOGLE_PERSONAL_REFRESH_TOKEN;
const workToken = process.env.GOOGLE_WORK_REFRESH_TOKEN;

if (!clientId || !clientSecret) {
  console.error("❌ Missing Client ID or Secret in .env.local");
  console.log("\n📝 Manual steps required:");
  console.log("1. Go to: https://console.cloud.google.com/apis/credentials?project=mimetic-science-477016-a1");
  console.log("2. Find OAuth 2.0 Client 'AHK command centre'");
  console.log("3. Copy Client ID and Client Secret");
  console.log("4. Update .env.local with the values");
  process.exit(1);
}

console.log(`✅ Client ID: ${clientId.substring(0, 20)}...`);
console.log(`✅ Client Secret: ${clientSecret.substring(0, 10)}...`);

// Step 3: Check tokens
console.log("\n🎫 Step 3: Checking refresh tokens...");
const needsPersonalToken = !personalToken || personalToken === "your_personal_refresh_token_here";
const needsWorkToken = !workToken || workToken === "your_work_refresh_token_here";

if (needsPersonalToken || needsWorkToken) {
  console.log("⚠️  Refresh tokens needed:");
  if (needsPersonalToken) {
    console.log("   ❌ Personal account (ashraf.kahoush@gmail.com)");
  } else {
    console.log("   ✅ Personal token configured");
  }
  if (needsWorkToken) {
    console.log("   ❌ Work account (ashraf@ahkstrategies.net)");
  } else {
    console.log("   ✅ Work token configured");
  }
  
  console.log("\n📋 To get refresh tokens:");
  console.log("1. Run: node src/scripts/getGoogleTokens.js");
  console.log("2. Authorize with PERSONAL account first");
  console.log("3. Copy the refresh token");
  console.log("4. Paste it into .env.local as GOOGLE_PERSONAL_REFRESH_TOKEN");
  console.log("5. Run the script again for WORK account");
  console.log("6. Paste that token as GOOGLE_WORK_REFRESH_TOKEN");
  console.log("7. Re-run this setup script");
  
  process.exit(0);
} else {
  console.log("✅ Personal token configured");
  console.log("✅ Work token configured");
}

// Step 4: Ready to build structure
console.log("\n🏗️  Step 4: Ready to build Emma folder structure!");
console.log("\n📋 Next command:");
console.log("   node build_emma_structure.js");
console.log("\nThis will create Emma/ folders in both Google Drives:");
console.log("   • Personal: ashraf.kahoush@gmail.com");
console.log("   • Work: ashraf@ahkstrategies.net");
console.log("\nWith subfolders:");
console.log("   ├── KnowledgeBase");
console.log("   ├── Instructions");
console.log("   ├── Dictionaries");
console.log("   ├── Memory");
console.log("   ├── Logs");
console.log("   ├── Archives");
console.log("   └── Integrations");

console.log("\n" + "=".repeat(60));
console.log("✨ All prerequisites verified! You're ready to proceed.\n");
