// src/ai/voiceEngine.js
import axios from "axios";

const BASE = "/api/voice";

export async function sttTranscribe(audioBase64, languageHint = "en") {
  try {
    const base64Data = audioBase64.split(",")[1]; // remove data URL header
    const audioBlob = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const formData = new FormData();
    formData.append("file", new Blob([audioBlob], { type: "audio/webm" }), "voice.webm");
    formData.append("language", languageHint);

    const res = await axios.post("/api/voice/stt", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return res.data; // { text: "...", language: "en" }
  } catch (err) {
    console.error("❌ STT Transcription error:", err);
    throw err;
  }
}

export async function ttsSpeak(text, lang = "en-US") {
  const r = await fetch(`${BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang })
  });
  const { audioBase64 } = await r.json();
  const audio = new Audio(audioBase64);
  await audio.play();
}

export async function detectIntent(text) {
  const { data } = await axios.post(`${BASE}/intent`, { text });
  return data; // { intent, text }
}
