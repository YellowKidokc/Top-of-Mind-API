// src/components/SmartVoiceConsole.jsx
import { sttTranscribe, ttsSpeak, detectIntent } from "../ai/voiceEngine";
import { runMultiAIAnalysis } from "../ai/orchestrator";
import { speak as browserSpeak, stopSpeak } from "../ai/speech"; // keep as fallback for dev test

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function SmartVoiceConsole() {
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startPTT = async () => {
    try {
      setStatus("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mr.onstop = async () => {
        try {
          // Check if we have valid audio data
          if (chunksRef.current.length === 0) {
            append("⚠️ No audio recorded. Please speak while holding the button.");
            setStatus("idle");
            return;
          }

          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          
          // Check blob size
          if (blob.size === 0 || blob.size < 100) {
            append("⚠️ Audio too short. Please speak longer.");
            setStatus("idle");
            return;
          }

          append("🎙️ Processing audio (" + Math.round(blob.size / 1024) + " KB)...");
          
          const b64 = await blobToBase64(blob);
          const response = await sttTranscribe(b64);
          const text = response.text || "";
          
          if (text) {
            append("You: " + text);
            const cleaned = text.replace(/^(emma|ايما|يا ايما|اما)\s*/i, "").trim();
            const intentObj = await detectIntent(cleaned);
            await routeIntent(intentObj, cleaned);
          } else {
            append("⚠️ No speech detected. Please try again.");
          }
          
          setStatus("idle");
        } catch (err) {
          console.error("STT Error:", err);
          append("❌ Transcription failed: " + (err.response?.data?.error || err.message));
          setStatus("idle");
        }
      };
      mr.start();
    } catch (err) {
      console.error("Microphone Error:", err);
      append("❌ Microphone access denied or unavailable");
      setStatus("idle");
    }
  };

  const stopPTT = () => {
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
        // Stop all tracks to release microphone
        const stream = mediaRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
    }
  };

  const routeIntent = async (intentObj, cleaned) => {
    switch (intentObj.intent) {
      case "WAKE_ACK":
        append("Emma: Yes, I'm here.");
        return ttsSpeak("Yes, I'm here.");
      case "START_ANALYSIS":
        append("Emma: Starting analysis...");
        await ttsSpeak("Starting analysis.");
        // Call your existing analysis flow
        try {
          const ctx = {}; // Build your context here
          const report = await runMultiAIAnalysis(ctx);
          append("Summary: " + (report.summary || "Analysis complete"));
          await ttsSpeak(report.summary || "Analysis complete.");
        } catch (e) {
          console.error("Analysis error:", e);
          append("Emma: Analysis failed.");
        }
        return;
      case "READ_REPORT":
        append("Emma: Reading the investor brief.");
        return ttsSpeak("Reading the investor brief.");
      case "NAV_DASHBOARD":
        append("Emma: Opening dashboard.");
        await ttsSpeak("Opening dashboard.");
        window.location.href = "/dashboard";
        return;
      case "NAV_STRATEGY":
        append("Emma: Opening strategy.");
        await ttsSpeak("Opening strategy.");
        window.location.href = "/strategy";
        return;
      case "NAV_REPORTS":
        append("Emma: Opening reports.");
        await ttsSpeak("Opening reports.");
        window.location.href = "/reports";
        return;
      case "STOP":
        append("Emma: Stopping.");
        return ttsSpeak("Stopping.");
      default:
        append("Emma: I didn't catch that, try again.");
        return ttsSpeak("I didn't catch that, try again.");
    }
  };

  function append(line) {
    setLog((prev) => [...prev, line].slice(-50));
  }

  return (
    <div className="emma-voice p-4 bg-gray-800 rounded-lg">
      <button
        onMouseDown={startPTT}
        onMouseUp={stopPTT}
        className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold"
      >
        🎙️ Hold to Talk (Hybrid Whisper)
      </button>
      <span className="ml-3 text-sm text-gray-300">
        {status === "listening" ? "Listening..." : "Ready"}
      </span>
      <button
        onClick={() => browserSpeak("If you can hear this, TTS fallback works.")}
        className="ml-2 px-3 py-2 rounded bg-green-600 hover:bg-green-500 text-white text-sm"
      >
        🧪 Test Browser TTS
      </button>
      <button
        onClick={() => stopSpeak("manual")}
        className="ml-2 px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm"
      >
        ⏹ Stop
      </button>
      <div className="mt-4 log bg-gray-900 p-3 rounded max-h-64 overflow-y-auto">
        {log.length === 0 && <div className="text-gray-500 text-sm">Voice log will appear here...</div>}
        {log.map((l, i) => (
          <div key={i} className="text-sm text-gray-200 py-1">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
