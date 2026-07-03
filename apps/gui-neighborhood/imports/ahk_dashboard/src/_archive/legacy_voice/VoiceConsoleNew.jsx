// /components/VoiceConsoleNew.jsx
import { useEffect, useState } from "react";
import { useVoiceConsole } from "../hooks/useVoiceConsole";
import { handleIntent } from "../lib/intentRouter";

export default function VoiceConsoleNew() {
  const [isOpen, setIsOpen] = useState(false);
  
  const voice = useVoiceConsole({
    wakePhrase: "emma, start analysis",
    inactivityMs: 60_000,
    pushToTalk: false,             // set true if you prefer hold-to-talk
    locale: "en-US",
    vadThreshold: 0.015,
    onIntent: async (intent, text) => handleIntent(intent, text),
  });

  // Auto-close when completed
  useEffect(() => {
    if (voice.state === "completed") {
      setTimeout(() => {
        setIsOpen(false);
        voice.stop(); // Ensure full cleanup
      }, 500);
    }
  }, [voice.state, voice]);

  // Open console when starting
  useEffect(() => {
    if (voice.state === "listening") {
      setIsOpen(true);
    }
  }, [voice.state]);

  const indicator = {
    idle: "Ready",
    listening: "Listening…",
    processing: "Processing…",
    speaking: "Speaking…",
    completed: "✅ Done",
    paused: "Paused",
    error: "Mic error",
  }[voice.state];

  const handleStart = () => {
    setIsOpen(true);
    voice.start();
  };

  const handleStop = () => {
    voice.stop();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleStart}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center text-white text-2xl transition-all"
        aria-label="Open voice console"
        disabled={!voice.isSupported}
      >
        🎤
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="rounded-2xl shadow-xl bg-black/70 backdrop-blur text-white p-4 w-[320px]">
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-80">AI Voice Console</div>
          <div className="text-xs px-2 py-1 rounded bg-white/10">{indicator}</div>
        </div>

        <div className="mt-3 min-h-[44px] text-sm">
          {voice.interim ? (
            <div className="opacity-70">{voice.interim}</div>
          ) : voice.transcript ? (
            <div className="opacity-90">{voice.transcript}</div>
          ) : (
            <div className="opacity-50">Say "Emma, start analysis", then "run sync".</div>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleStop}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm flex-1"
            aria-label="Stop and close"
          >
            🔇 Close
          </button>

          <button
            onClick={() => voice.cancelSpeech()}
            className="px-3 py-2 rounded-xl bg-zinc-600 hover:bg-zinc-700 text-white text-sm"
            aria-label="Stop speaking"
          >
            Cancel
          </button>
        </div>

        {!voice.isSupported && (
          <div className="mt-3 text-xs text-amber-300">
            Your browser doesn't support speech recognition. Use Chrome or Edge.
          </div>
        )}
        {voice.lastError && (
          <div className="mt-2 text-xs text-red-300">Error: {voice.lastError}</div>
        )}
      </div>
    </div>
  );
}
