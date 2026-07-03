// server/routes/google-drive-routes.js
import express from "express";
import drive from "../google-drive-oauth.js";

const router = express.Router();

// Simple test route to check auth and connectivity
router.get("/status", async (req, res) => {
  try {
    // Test Drive access by getting user info
    const result = await drive.about.get({ fields: 'user' });
    res.json({ 
      status: "Google Drive connected",
      ok: true,
      user: result.data.user.emailAddress,
      displayName: result.data.user.displayName
    });
  } catch (err) {
    console.error('Google Drive status error:', err);
    res.status(500).json({ 
      ok: false, 
      status: "error",
      error: err.message 
    });
  }
});

// Trigger sync - support both GET and POST
router.get("/sync", async (req, res) => {
  try {
    // basic test for now until full sync logic is ready
    const files = await drive.files.list({ pageSize: 10 });
    res.json({ ok: true, success: true, files: files.data.files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    // basic test for now until full sync logic is ready
    const files = await drive.files.list({ pageSize: 10 });
    res.json({ ok: true, success: true, files: files.data.files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
