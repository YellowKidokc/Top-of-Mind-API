// server/voice/router.js
// Environment variables loaded by server/index.js before this module imports

import express from "express";
import fetch from "node-fetch";
import multer from "multer";
import OpenAI from "openai";
import detectIntentFromText from "./intentMap.cjs";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client lazily to ensure env vars are loaded
let openai = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

console.log("🎙️ Voice Router initialized");
console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : "❌ MISSING");
console.log("🔑 ElevenLabs API Key:", process.env.ELEVENLABS_API_KEY ? "✅ Loaded" : "❌ MISSING");
console.log("✅ Whisper STT endpoint ready");
console.log("✅ ElevenLabs TTS endpoint ready");
console.log("✅ Intent detection endpoint ready");

// --- STT: OpenAI Whisper ---
router.post("/stt", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 STT Request received");
    console.log("   - Has file:", !!req.file);
    console.log("   - Content-Type:", req.headers['content-type']);
    console.log("   - Language hint:", req.body.language);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY missing");
      return res.status(400).json({ error: "OPENAI_API_KEY missing" });
    }

    if (!req.file) {
      console.error("❌ No audio file provided in request");
      return res.status(400).json({ error: "No audio file provided" });
    }

    console.log("   - File buffer size:", req.file.buffer.length, "bytes");
    console.log("   - File mimetype:", req.file.mimetype);
    console.log("   - File originalname:", req.file.originalname);

    const languageHint = req.body.language || "en";

    console.log("🎤 Calling Whisper API...");
    console.log("   - API Key length:", process.env.OPENAI_API_KEY.length);
    console.log("   - API Key prefix:", process.env.OPENAI_API_KEY.substring(0, 10));
    console.log("   - Sending buffer directly to Whisper (WebM support)");
    
    // Create a File object from the buffer for OpenAI SDK
    const file = new File([req.file.buffer], req.file.originalname || "audio.webm", {
      type: req.file.mimetype || "audio/webm"
    });
    
    const response = await getOpenAI().audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      response_format: "text"
    });

    console.log("✅ Whisper response:", response?.substring(0, 50) + "...");

    res.json({ text: response || "", language: languageHint });
  } catch (e) {
    console.error("❌ Whisper STT Error:", e);
    console.error("   - Error name:", e.name);
    console.error("   - Error message:", e.message);
    console.error("   - Error code:", e.code);
    console.error("   - Error status:", e.status);
    console.error("   - Error response:", e.response?.data);
    if (e.stack) {
      console.error("   - Stack trace:", e.stack.substring(0, 200));
    }
    res.status(500).json({ 
      error: "STT failed", 
      detail: e.message,
      code: e.code,
      status: e.status
    });
  }
});

// --- Intent: Rhino (if available) else regex map ---
router.post("/intent", async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.json({ intent: "UNKNOWN", text: "" });

    if (USE_RHINO && PICOVOICE_ACCESS_KEY) {
      // Keep this branch for later when approved
      // For now, we short-circuit to regex
    }

    const result = detectIntentFromText(text);
    res.json(result);
  } catch (e) {
    console.error("Intent error:", e);
    res.status(500).json({ error: "Intent failed", detail: e.message });
  }
});

// --- TTS: ElevenLabs ---
router.post("/tts", async (req, res) => {
  try {
    const { text, lang = "en-US", voiceId } = req.body || {};
    if (!text) return res.status(400).json({ error: "Missing text" });
    if (!ELEVENLABS_API_KEY) return res.status(400).json({ error: "ELEVENLABS_API_KEY missing" });

    const chosen = voiceId || (lang.startsWith("ar") ? "Rachel" : "Rachel");
    const payload = {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }
    };

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(chosen)}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(t);
    }

    const arrayBuf = await r.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    res.json({ audioBase64: `data:audio/mpeg;base64,${base64}` });
  } catch (e) {
    console.error("TTS error:", e);
    res.status(500).json({ error: "TTS failed", detail: e.message });
  }
});

export default router;