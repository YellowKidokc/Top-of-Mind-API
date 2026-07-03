// /hooks/useVoiceConsole.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const pickFemaleVoice = (locale) => {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  
  // FORCE female voice - multiple patterns
  const femaleVoice = voices.find(v =>
    (locale ? v.lang.toLowerCase().startsWith(locale.toLowerCase().split('-')[0]) : true) &&
    /(female|woman|samantha|zira|sara|karen|victoria|susan|allison|ava|serena|fiona)/i.test(v.name)
  );
  
  if (femaleVoice) {
    console.log('🎤 Emma voice selected:', femaleVoice.name);
    return femaleVoice;
  }
  
  // Fallback to any voice matching locale
  const fallback = voices.find(v => (locale ? v.lang.startsWith(locale.split('-')[0]) : true)) || voices[0];
  if (fallback) {
    console.warn('⚠️ Using fallback voice:', fallback.name);
  }
  return fallback || null;
};

export function useVoiceConsole(opts = {}) {
  const {
    wakePhrase = "emma, start analysis",
    inactivityMs = 60_000,
    pushToTalk = false,
    locale = "en-US",
    vadThreshold = 0.015,
    onIntent,
  } = opts;

  const Recognition = (typeof window !== "undefined")
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

  const isSupported = !!(Recognition && window.speechSynthesis);
  const recRef = useRef(null);
  const [state, setState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const inactivityTimer = useRef(null);
  const audioCtxRef = useRef(null);
  const meterRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const lastError = useRef(undefined);
  const speakingRef = useRef(false);
  const completedRef = useRef(false); // Track if command was completed

  // simple intent router
  const localIntent = useCallback((text) => {
    const t = text.toLowerCase().trim();
    if (!t) return "none";
    if (t.includes("run sync") || t.includes("synchronize") || t.includes("sync now")) return "runSync";
    if (t.startsWith("stop") || t.includes("cancel")) return "stop";
    if (t.includes("start listening")) return "startListening";
    if (t.includes("help")) return "help";
    return "none";
  }, []);

  const resetInactivity = useCallback(() => {
    if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
    inactivityTimer.current = window.setTimeout(() => {
      if (state === "listening") stop();
    }, inactivityMs);
  }, [inactivityMs, state]);

  const stopAudioGraph = useCallback(() => {
    meterRef.current?.disconnect();
    sourceRef.current?.disconnect();
    mediaStreamRef.current?.getTracks()?.forEach(t => t.stop());
    meterRef.current = null;
    sourceRef.current = null;
    mediaStreamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {}); // Ensure close completes
    }
    audioCtxRef.current = null;
  }, []);

  const stopRecognition = useCallback(() => {
    try { recRef.current?.stop?.(); } catch {}
    recRef.current = null;
  }, []);

  const stop = useCallback(() => {
    stopRecognition();
    stopAudioGraph();
    setState("idle");
    setInterim("");
    setTranscript("");
    completedRef.current = false;
    if (inactivityTimer.current) window.clearTimeout(inactivityTimer.current);
  }, [stopAudioGraph, stopRecognition]);

  const speak = useCallback(async (text) => {
    if (!window.speechSynthesis) return;
    speakingRef.current = true;
    setState("speaking");
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice(locale);
    if (voice) utter.voice = voice;
    utter.rate = 1.0;
    utter.pitch = 1.15; // Higher pitch for more feminine voice
    utter.onend = () => {
      speakingRef.current = false;
      // After speaking, transition to completed state and auto-close
      setState("completed");
      setTimeout(() => {
        stop(); // Full cleanup
      }, 500); // Brief delay to show completed state
    };
    utter.onerror = () => {
      speakingRef.current = false;
      setState("error");
      setTimeout(() => {
        stop();
      }, 1000);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [locale, stop]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    speakingRef.current = false;
    setState("idle");
  }, []);

  // Very light VAD: if energy consistently below threshold, auto-stop
  const startVAD = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    sourceRef.current = src;
    meterRef.current = analyser;

    const data = new Uint8Array(analyser.fftSize);
    let silentFrames = 0;
    const maxSilentFrames = 120; // ~2s at 60fps

    const tick = () => {
      if (!meterRef.current || state !== "listening" || completedRef.current) return;
      analyser.getByteTimeDomainData(data);
      // normalize energy
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      if (rms < vadThreshold) {
        silentFrames++;
        if (silentFrames > maxSilentFrames) {
          // user quiet for a while ⇒ complete session
          completedRef.current = true;
          stop();
          return;
        }
      } else {
        silentFrames = 0;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [state, vadThreshold, stop]);

  const start = useCallback(async () => {
    if (!isSupported) return;
    if (speakingRef.current) cancelSpeech();

    // Reset completion flag for new session
    completedRef.current = false;

    const rec = new Recognition();
    rec.continuous = false; // ONE-SHOT MODE: stop after first final result
    rec.interimResults = true;
    rec.lang = locale;
    rec.onresult = async (e) => {
      let full = "";
      let last = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const str = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          full += str + " ";
          setTranscript(prev => (prev + " " + str).trim());
        } else {
          last = str;
        }
      }
      setInterim(last);
      resetInactivity();

      const text = (full || "").toLowerCase().trim();
      if (text) {
        // wake phrase gate
        if (text.startsWith(wakePhrase.toLowerCase())) {
          setTranscript("");
          setInterim("");
          completedRef.current = true; // Mark as completed
          if (onIntent) {
            setState("processing");
            const reply = await onIntent("wake", text);
            if (reply) await speak(reply);
          }
          return;
        }
        // intents
        const intent = localIntent(text);
        if (intent !== "none" && onIntent) {
          setState("processing");
          completedRef.current = true; // Mark as completed
          const reply = await onIntent(intent, text);
          if (reply) {
            await speak(reply);
          } else {
            // No reply, just complete
            setState("completed");
            setTimeout(() => stop(), 500);
          }
        }
      }
    };
    rec.onerror = (e) => {
      lastError.current = e?.error || "recognition_error";
      setState("error");
      setTimeout(() => stop(), 1000);
    };
    rec.onend = () => {
      // if completed, ensure cleanup happens
      if (completedRef.current) {
        setTimeout(() => stop(), 100);
      } else if (!pushToTalk) {
        setState("idle");
      }
    };
    recRef.current = rec;

    try {
      await startVAD();
    } catch (e) {
      lastError.current = "microphone_denied";
      setState("error");
      return;
    }

    setTranscript("");
    setInterim("");
    setState("listening");
    resetInactivity();
    try { rec.start(); } catch {}
  }, [Recognition, cancelSpeech, isSupported, locale, localIntent, onIntent, pushToTalk, resetInactivity, speak, startVAD, stop, wakePhrase]);

  const pttDown = useCallback(async () => {
    if (!pushToTalk) return;
    await start();
  }, [pushToTalk, start]);

  const pttUp = useCallback(() => {
    if (!pushToTalk) return;
    stop();
  }, [pushToTalk, stop]);

  useEffect(() => {
    if (!isSupported) return;
    // some browsers need a warmup to populate voices
    const id = setInterval(() => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [isSupported]);

  useEffect(() => () => stop(), [stop]);

  return useMemo(() => ({
    state, isSupported, transcript, interim,
    start, stop, speak, cancelSpeech,
    pttDown, pttUp,
    lastError: lastError.current,
  }), [state, isSupported, transcript, interim, start, stop, speak, cancelSpeech, pttDown, pttUp]);
}
