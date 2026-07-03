#Requires AutoHotkey v2.0
#SingleInstance Force

; ============================================================
; TTS Clip — Drop-in replacement for BetterTTS.exe
; Matches BetterTTS hotkeys exactly. Close BetterTTS first.
;
; CapsLock+C = grab selected text, clean it, speak it
; CapsLock+V = speak current clipboard (manual trigger)
; CapsLock+P = pause / resume
; CapsLock+S = stop immediately
; CapsLock+Up/Down   = volume up / down
; CapsLock+Right/Left = speed up / down
; Ctrl+Alt+]  = next voice   |  Ctrl+Alt+[  = previous voice
; Ctrl+Alt+T  = toggle TTS on/off
; ============================================================

global TTS_INI    := A_ScriptDir "\config\tts_clip.ini"
global TTS_ACTIVE := true
global gIsPaused  := false
global oVoice     := ""

InitVoice()
TrayTip("TTS Clip", "Ready — CapsLock+C to speak", 2)

; ── CapsLock+C : grab selection, clean, speak ───────────────
CapsLock & c:: {
    if !TTS_ACTIVE
        return
    prevClip := A_Clipboard
    A_Clipboard := ""
    Send "^c"
    if !ClipWait(0.6)
        return
    txt := A_Clipboard
    A_Clipboard := prevClip
    SpeakClean(txt)
}

; ── CapsLock+V : speak current clipboard ────────────────────
CapsLock & v:: {
    SpeakClean(A_Clipboard)
}

; ── CapsLock+P : pause / resume ─────────────────────────────
CapsLock & p:: {
    global oVoice, gIsPaused
    if !gIsPaused {
        try oVoice.Pause()
        gIsPaused := true
    } else {
        try oVoice.Resume()
        gIsPaused := false
    }
}

; ── CapsLock+S : stop ───────────────────────────────────────
CapsLock & s:: {
    global oVoice, gIsPaused
    gIsPaused := false
    try oVoice.Speak("", 3)   ; purge + async = immediate stop
}

; ── CapsLock+Up/Down : volume ───────────────────────────────
CapsLock & Up:: {
    global oVoice, TTS_INI
    vol := Min(oVoice.Volume + 10, 100)
    oVoice.Volume := vol
    IniWrite(vol, TTS_INI, "TTS", "Volume")
    TrayTip("Volume", vol "%", 1)
}
CapsLock & Down:: {
    global oVoice, TTS_INI
    vol := Max(oVoice.Volume - 10, 0)
    oVoice.Volume := vol
    IniWrite(vol, TTS_INI, "TTS", "Volume")
    TrayTip("Volume", vol "%", 1)
}

; ── CapsLock+Right/Left : speed ─────────────────────────────
CapsLock & Right:: {
    global oVoice, TTS_INI
    spd := Min(oVoice.Rate + 1, 10)
    oVoice.Rate := spd
    IniWrite(spd, TTS_INI, "TTS", "Speed")
    TrayTip("Speed", spd, 1)
}
CapsLock & Left:: {
    global oVoice, TTS_INI
    spd := Max(oVoice.Rate - 1, -10)
    oVoice.Rate := spd
    IniWrite(spd, TTS_INI, "TTS", "Speed")
    TrayTip("Speed", spd, 1)
}

; ── Ctrl+Alt+[ / ] : cycle voice ────────────────────────────
^![:: CycleVoice(-1)
^!]:: CycleVoice(1)

; ── Ctrl+Alt+T : toggle on/off ──────────────────────────────
^!t:: {
    global TTS_ACTIVE, oVoice, gIsPaused
    TTS_ACTIVE := !TTS_ACTIVE
    if !TTS_ACTIVE {
        try oVoice.Speak("", 3)
        gIsPaused := false
    }
    TrayTip("TTS Clip", TTS_ACTIVE ? "ON" : "OFF", 1)
}

; ============================================================
; SPEECH ENGINE
; ============================================================

InitVoice() {
    global oVoice, TTS_INI
    oVoice := ComObject("SAPI.SpVoice")
    ; Pin output format — prevents the "needs refresh" bug
    try {
        oVoice.AllowAudioOutputFormatChangesOnNextSet := 0
        oVoice.AudioOutputStream.Format.Type := 39
        oVoice.AudioOutputStream := oVoice.AudioOutputStream
        oVoice.AllowAudioOutputFormatChangesOnNextSet := 1
    }
    ; Restore saved voice/volume/speed
    idx := IniRead(TTS_INI, "TTS", "VoiceIndex", 0)
    vol := IniRead(TTS_INI, "TTS", "Volume",     90)
    spd := IniRead(TTS_INI, "TTS", "Speed",       0)
    try oVoice.Voice  := oVoice.GetVoices().Item(idx)
    oVoice.Volume := vol
    oVoice.Rate   := spd
}

SpeakClean(rawText) {
    global oVoice, gIsPaused
    txt := CleanForTTS(rawText)
    if (StrLen(Trim(txt)) < 3)
        return
    gIsPaused := false
    try oVoice.Speak("", 3)    ; stop any current speech first
    try oVoice.Speak(txt, 1)   ; SVSFlagsAsync = non-blocking
}

CycleVoice(dir) {
    global oVoice, TTS_INI
    voices := oVoice.GetVoices()
    count  := voices.Count
    idx    := IniRead(TTS_INI, "TTS", "VoiceIndex", 0) + dir
    if (idx < 0)
        idx := count - 1
    if (idx >= count)
        idx := 0
    try oVoice.Voice := voices.Item(idx)
    IniWrite(idx, TTS_INI, "TTS", "VoiceIndex")
    name := oVoice.Voice.GetDescription()
    TrayTip("Voice " (idx+1) "/" count, name, 2)
}

; ============================================================
; TEXT CLEANER — strips markdown artifacts before speaking
; ============================================================

CleanForTTS(txt) {
    ; In AHK v2 strings, `` (two backticks) = one literal backtick character.
    ; So `````` = three backticks in the regex pattern.

    ; ── Remove fenced code blocks (don't read code) ──────────
    txt := RegExReplace(txt, "``````[\s\S]*?``````", "")

    ; ── Remove inline code ───────────────────────────────────
    txt := RegExReplace(txt, "``[^``\n]+``", "")

    ; ── Strip bold/italic marks, keep inner text ─────────────
    txt := RegExReplace(txt, "\*\*\*(.+?)\*\*\*", "$1")
    txt := RegExReplace(txt, "\*\*(.+?)\*\*",     "$1")
    txt := RegExReplace(txt, "\*(.+?)\*",         "$1")
    txt := RegExReplace(txt, "__(.+?)__",         "$1")
    txt := RegExReplace(txt, "_(.+?)_",           "$1")
    txt := RegExReplace(txt, "~~(.+?)~~",         "$1")

    ; ── Headings → plain text ────────────────────────────────
    txt := RegExReplace(txt, "(?m)^#{1,6}\s+", "")

    ; ── Bullet and numbered lists → just the text ────────────
    txt := RegExReplace(txt, "(?m)^\s*[-*+]\s+", "")
    txt := RegExReplace(txt, "(?m)^\s*\d+\.\s+", "")

    ; ── Horizontal rules ─────────────────────────────────────
    txt := RegExReplace(txt, "(?m)^[-*_]{3,}\s*$", "")

    ; ── Markdown links/images → keep label text only ─────────
    txt := RegExReplace(txt, "!\[([^\]]*)\]\([^\)]*\)", "$1")
    txt := RegExReplace(txt, "\[([^\]]*)\]\([^\)]*\)",  "$1")
    txt := RegExReplace(txt, "https?://\S+",            "")

    ; ── Characters that get spoken as words but shouldn't ────
    txt := RegExReplace(txt, "[|\\]",  " ")
    txt := RegExReplace(txt, ">",      " ")
    txt := RegExReplace(txt, "#",      " ")
    txt := RegExReplace(txt, "={3,}",  " ")

    ; ── Collapse whitespace ───────────────────────────────────
    txt := RegExReplace(txt, "[ `t]{2,}", " ")
    txt := RegExReplace(txt, "\n{3,}",    "`n`n")
    txt := Trim(txt)

    return txt
}
