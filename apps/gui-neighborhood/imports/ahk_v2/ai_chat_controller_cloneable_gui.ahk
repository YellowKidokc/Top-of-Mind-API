; ============================================================
; AI Chat Controller v2 — AutoHotkey v2
; Window-anchored overlay with per-app profiles,
; auto-scroll, and a command line.
;
; PROFILES: Claude, Kimi, Codex, TypingMind, GPT (Ctrl+1-5)
;
; HOTKEYS:
;   Ctrl+Shift+V  — Paste clipboard into chat + send
;   Ctrl+Shift+R  — Pull latest file from File Drop API
;   Ctrl+Shift+S  — Send (Enter)
;   Ctrl+Shift+M  — Click mic/voice area
;   Ctrl+Shift+P  — Push clipboard → File Drop API
;   Ctrl+Shift+B  — Recalibrate anchor
;   Ctrl+Shift+A  — Toggle auto-scroll
;   Ctrl+Shift+Q  — Quit
;   Ctrl+1-5      — Switch profile
;
; COMMAND LINE (type in the box at bottom):
;   /send <text>     — Type text into chat + send
;   /paste            — Paste clipboard into chat
;   /push <text>      — Push text to File Drop API as .md
;   /pull             — Pull latest file from drop → clipboard
;   /scroll           — Toggle auto-scroll
;   /speed <n>        — Set scroll speed (1=slow, 10=fast)
;   /profile <1-5>    — Switch profile
;   /anchor           — Recalibrate
;   /mic              — Toggle voice
;   /shell <cmd>      — Run a shell command, result → clipboard
;   /api <json>       — POST raw JSON to File Drop /create
;   /list             — List files in drop folder → clipboard
;   /quit             — Exit
; ============================================================

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; ── CONFIG ──────────────────────────────────────────────────
FILE_DROP_URL := "http://localhost:8100/file-drop"
SOURCE_NAME  := "ahk-controller"
HUB_BASE_URL := EnvGet("FIHUB_BASE_URL")
if (HUB_BASE_URL = "")
    HUB_BASE_URL := "http://127.0.0.1:10000"
HUB_TOKEN := EnvGet("FIHUB_TOKEN")
FOLLOW_INTERVAL := 100
SCROLL_INTERVAL := 80
INSTANCE_LABEL := "AI"
ENABLE_HOTKEYS := true
START_X := 100
START_Y := 100

for arg in A_Args {
    if RegExMatch(arg, "^--name=(.*)$", &m)
        INSTANCE_LABEL := Trim(m[1])
    else if (arg = "--no-hotkeys")
        ENABLE_HOTKEYS := false
    else if RegExMatch(arg, "^--x=(-?\d+)$", &m)
        START_X := Integer(m[1])
    else if RegExMatch(arg, "^--y=(-?\d+)$", &m)
        START_Y := Integer(m[1])
}

if (INSTANCE_LABEL = "")
    INSTANCE_LABEL := "AI"

scrollSpeed := 3  ; lines per tick
isScrolling := false

; ── APP PROFILES ────────────────────────────────────────────
class Profile {
    __New(name, proc, title, offR, offB, inpW, inpH) {
        this.name  := name
        this.proc  := proc
        this.title := title
        this.offR  := offR
        this.offB  := offB
        this.inpW  := inpW
        this.inpH  := inpH
    }
}

profiles := [
    Profile("Claude",     "chrome.exe",  "Claude",      420, 220, 600, 50),
    Profile("Kimi",       "kimi.exe",    "Kimi",        420, 220, 600, 50),
    Profile("Codex",      "Codex.exe",   "Codex",       420, 200, 700, 110),
    Profile("TypingMind", "chrome.exe",  "TypingMind",  420, 220, 600, 50),
    Profile("GPT",        "chrome.exe",  "ChatGPT",     420, 220, 600, 50),
]

activeIdx := 1
activeProfile := profiles[activeIdx]
isAnchored := false
anchorHwnd := 0

; ── GUI ─────────────────────────────────────────────────────
g := Gui("+AlwaysOnTop +ToolWindow -Caption +Border +Resize +MinSize360x160")
g.BackColor := "0f0f0f"
g.MarginX := 5
g.MarginY := 3

; ── Row 1: Profile buttons ──
g.SetFont("s7 Bold c" "d9a441", "Consolas")
g.Add("Text", "x5 y3 w30 h16", "APP:")

g.SetFont("s7 c" "e9e6dd", "Consolas")
profileBtns := []
xp := 38
for idx, p in profiles {
    btn := g.Add("Button", "x" xp " y1 w50 h18", p.name)
    btn.OnEvent("Click", MakeProfileSwitcher(idx))
    profileBtns.Push(btn)
    xp += 52
}

g.SetFont("s7 Bold c" "d9a441", "Consolas")
instanceLabel := g.Add("Text", "x298 y3 w52 h16 Right", INSTANCE_LABEL)
instanceLabel.OnEvent("Click", DoRenameInstance)
btnClone := g.Add("Button", "x354 y1 w48 h18", "+New")

; ── Row 2: Anchor status ──
g.SetFont("s7 c" "5fb3ae", "Consolas")
anchorLabel := g.Add("Text", "x5 y20 w290 h13", "Not anchored — Ctrl+Alt+Shift+B")

; ── Row 3: Simple hub controls ──
g.SetFont("s8 c" "e9e6dd", "Segoe UI")
y3 := 35
btnPaste  := g.Add("Button", "x5   y" y3 " w65 h26", "📋Paste")
btnSend   := g.Add("Button", "x73  y" y3 " w55 h26", "▶Send")
btnMemory := g.Add("Button", "x131 y" y3 " w78 h26", "💾Memory")
btnEndAll := g.Add("Button", "x212 y" y3 " w72 h26", "⛔End All")
btnHub    := g.Add("Button", "x287 y" y3 " w50 h26", "Hub")
btnMic    := g.Add("Button", "x340 y" y3 " w40 h26", "🎤")

; ── Row 4: Secondary controls ──
y4 := 63
btnPull   := g.Add("Button", "x5   y" y4 " w55 h26", "📥Pull")
btnPush   := g.Add("Button", "x63  y" y4 " w55 h26", "📤Push")
btnScroll := g.Add("Button", "x121 y" y4 " w90 h26", "⏬ Scroll")
g.SetFont("s7 c" "9aa1b0", "Consolas")
g.Add("Text", "x216 y" (y4+6) " w30 h16", "Spd:")
speedCtrl := g.Add("Edit", "x248 y" (y4+3) " w30 h20 Number Center", String(scrollSpeed))
speedCtrl.SetFont("s7 c" "e9e6dd", "Consolas")
btnCalib  := g.Add("Button", "x286 y" y4 " w60 h26", "🎯Set")
btnQuit   := g.Add("Button", "x353 y" y4 " w50 h26", "✕")

; ── Row 5: Command line ──
y5 := 93
g.SetFont("s7 c" "d9a441", "Consolas")
g.Add("Text", "x5 y" (y5+3) " w12 h16", ">")
g.SetFont("s8 c" "e9e6dd", "Consolas")
cmdInput := g.Add("Edit", "x18 y" y5 " w340 h22 Background" "1a1a1a", "")
g.SetFont("s8 c" "e9e6dd", "Segoe UI")
btnRun := g.Add("Button", "x362 y" y5 " w28 h22", "↵")

; ── Row 6: Status ──
g.SetFont("s6 c" "6a7080", "Consolas")
status := g.Add("Text", "x5 y118 w390 h12", "Ready. +New makes another named overlay. Click the corner name to rename.")

; ── Wire events ─────────────────────────────────────────────
btnPaste.OnEvent("Click", DoPasteSend)
btnSend.OnEvent("Click", DoSend)
btnMemory.OnEvent("Click", DoSaveMemory)
btnEndAll.OnEvent("Click", DoEndAll)
btnHub.OnEvent("Click", DoHubStats)
btnPull.OnEvent("Click", DoPullFile)
btnPush.OnEvent("Click", DoPushClip)
btnMic.OnEvent("Click", DoVoice)
btnScroll.OnEvent("Click", DoToggleScroll)
btnCalib.OnEvent("Click", DoCalibrate)
btnQuit.OnEvent("Click", DoQuit)
btnRun.OnEvent("Click", DoRunCmd)
btnClone.OnEvent("Click", DoSpawnClone)

speedCtrl.OnEvent("Change", DoSpeedChange)

g.OnEvent("Size", DoGuiSize)
g.OnEvent("Close", DoQuit)
g.Title := "AI Chat Controller - " INSTANCE_LABEL
g.Show("w408 h133 x" START_X " y" START_Y)

; Draggable
OnMessage(0x0201, WM_LBUTTONDOWN)
WM_LBUTTONDOWN(wParam, lParam, msg, hwnd) {
    if (hwnd = g.Hwnd)
        PostMessage(0xA1, 2, 0, , g.Hwnd)
}

; Enter key in command line triggers run
cmdInput.OnEvent("Change", (*) => 0)  ; placeholder
OnMessage(0x0100, OnKeyDown)
OnKeyDown(wParam, lParam, msg, hwnd) {
    if (hwnd = cmdInput.Hwnd && wParam = 13) {  ; VK_RETURN
        DoRunCmd()
        return 0
    }
}

DoGuiSize(guiObj, minMax, width, height) {
    global cmdInput, btnRun, status, anchorLabel, instanceLabel, btnClone
    if (width < 360)
        return
    cmdInput.Move(18, 93, Max(100, width - 68), 22)
    btnRun.Move(width - 46, 93, 28, 22)
    status.Move(5, 118, Max(100, width - 10), 12)
    anchorLabel.Move(5, 20, Max(100, width - 10), 13)
    instanceLabel.Move(Max(290, width - 110), 3, 52, 16)
    btnClone.Move(width - 54, 1, 48, 18)
}

; ── TIMERS ──────────────────────────────────────────────────
SetTimer(FollowTarget, FOLLOW_INTERVAL)

FollowTarget() {
    global isAnchored, anchorHwnd, activeProfile, g
    if !isAnchored
        return
    if !WinExist("ahk_id " anchorHwnd) {
        isAnchored := false
        anchorLabel.Text := "⚠ Window lost"
        return
    }
    try {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " anchorHwnd)
        newX := wx + ww - activeProfile.offR
        newY := wy + wh - activeProfile.offB
        g.Move(newX, newY)
    }
}

DoAutoScroll() {
    global isScrolling, scrollSpeed, anchorHwnd, isAnchored
    if !isScrolling
        return
    if isAnchored && WinExist("ahk_id " anchorHwnd) {
        try WinActivate("ahk_id " anchorHwnd)
        ; Scroll down by sending mouse wheel
        loop scrollSpeed
            Send("{WheelDown}")
    }
}

; ── PROFILE SWITCHING ───────────────────────────────────────
MakeProfileSwitcher(idx) {
    return (*) => SwitchProfile(idx)
}

SwitchProfile(idx) {
    global activeIdx, activeProfile
    activeIdx := idx
    activeProfile := profiles[idx]
    for i, btn in profileBtns {
        if (i = idx)
            btn.Opt("Background" "2c3240")
        else
            btn.Opt("BackgroundDefault")
    }
    TryAnchor()
    SetStatus(activeProfile.name " active")
}

TryAnchor() {
    global activeProfile, isAnchored, anchorHwnd
    hwnd := 0
    if (activeProfile.title != "")
        try hwnd := WinExist(activeProfile.title)
    if (!hwnd && activeProfile.proc != "")
        try hwnd := WinExist("ahk_exe " activeProfile.proc)
    if hwnd {
        anchorHwnd := hwnd
        isAnchored := true
        try {
            WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " hwnd)
            anchorLabel.Text := "🔗 " activeProfile.name " (" ww "x" wh ")"
        }
    } else {
        isAnchored := false
        anchorLabel.Text := "⚠ " activeProfile.name " not found"
    }
}

; ── HOTKEYS ─────────────────────────────────────────────────
if ENABLE_HOTKEYS
    InstallGlobalHotkeys()
else
    SetStatus("GUI-only clone. Buttons work. Global hotkeys are off.")

InstallGlobalHotkeys() {
    Hotkey("^!+v", DoPasteSend, "On")
    Hotkey("^!+r", DoPullFile, "On")
    Hotkey("^!+Enter", DoSend, "On")
    Hotkey("^!+m", DoSaveMemory, "On")
    Hotkey("^!+s", DoSaveMemory, "On")
    Hotkey("^!+p", DoPushClip, "On")
    Hotkey("^!+b", DoCalibrate, "On")
    Hotkey("^!+a", DoToggleScroll, "On")
    Hotkey("^!+e", DoEndAll, "On")
    Hotkey("^!+h", DoHubStats, "On")
    Hotkey("^!+1", (*) => SwitchProfile(1), "On")
    Hotkey("^!+2", (*) => SwitchProfile(2), "On")
    Hotkey("^!+3", (*) => SwitchProfile(3), "On")
    Hotkey("^!+4", (*) => SwitchProfile(4), "On")
    Hotkey("^!+5", (*) => SwitchProfile(5), "On")
    SimpleTapHotkeys(360)
}

class SimpleTapHotkeys {
    __New(windowMs := 360) {
        this.windowMs := windowMs
        this.lastEnterTick := 0
        this.lastCtrlVTick := 0
        this.lastCtrlCTick := 0
        this.enterTimer := this.FlushEnter.Bind(this)
        this.ctrlVTimer := this.FlushCtrlV.Bind(this)
        this.ctrlCTimer := this.FlushCtrlC.Bind(this)
        HotIf(this.IsAllowed.Bind(this))
        Hotkey("$Enter", this.HandleEnter.Bind(this), "On")
        Hotkey("$^v", this.HandleCtrlV.Bind(this), "On")
        Hotkey("$^c", this.HandleCtrlC.Bind(this), "On")
        HotIf()
    }

    IsAllowed(*) {
        global anchorHwnd, g
        if IsSet(anchorHwnd) && anchorHwnd && WinActive("ahk_id " anchorHwnd)
            return true
        if IsSet(g) && g && WinActive("ahk_id " g.Hwnd)
            return true
        return false
    }

    HandleEnter(*) {
        now := A_TickCount
        if (this.lastEnterTick && now - this.lastEnterTick <= this.windowMs) {
            this.lastEnterTick := 0
            SetTimer(this.enterTimer, 0)
            DoSend()
            return
        }
        this.lastEnterTick := now
        SetTimer(this.enterTimer, -this.windowMs)
    }

    FlushEnter() {
        if !this.lastEnterTick
            return
        this.lastEnterTick := 0
        Send("{Enter}")
    }

    HandleCtrlV(*) {
        now := A_TickCount
        if (this.lastCtrlVTick && now - this.lastCtrlVTick <= this.windowMs) {
            this.lastCtrlVTick := 0
            SetTimer(this.ctrlVTimer, 0)
            DoPasteSend()
            return
        }
        this.lastCtrlVTick := now
        SetTimer(this.ctrlVTimer, -this.windowMs)
    }

    FlushCtrlV() {
        if !this.lastCtrlVTick
            return
        this.lastCtrlVTick := 0
        Send("^v")
    }

    HandleCtrlC(*) {
        now := A_TickCount
        if (this.lastCtrlCTick && now - this.lastCtrlCTick <= this.windowMs) {
            this.lastCtrlCTick := 0
            SetTimer(this.ctrlCTimer, 0)
            DoEndAll()
            return
        }
        this.lastCtrlCTick := now
        SetTimer(this.ctrlCTimer, -this.windowMs)
    }

    FlushCtrlC() {
        if !this.lastCtrlCTick
            return
        this.lastCtrlCTick := 0
        Send("^c")
    }
}
; ── CLONE / NAME FUNCTIONS ───────────────────────────────────
DoSpawnClone(*) {
    global g
    defaultName := "AI-" FormatTime(, "HHmmss")
    result := InputBox("Name the new overlay, like Codex, Gemini, Claude 2, Research, or Writer.", "New Overlay", "w380 h135", defaultName)
    if (result.Result != "OK")
        return
    name := Trim(result.Value)
    if (name = "")
        name := defaultName
    try {
        WinGetPos(&gx, &gy, &gw, &gh, "ahk_id " g.Hwnd)
        clonePath := CreateCloneScript(name)
        RunClone(clonePath, name, gx + 28, gy + 28)
        SetStatus("Spawned " name ".")
    } catch as e {
        SetStatus("Clone failed: " e.Message)
    }
}

SpawnCloneByName(name) {
    global g
    name := Trim(name)
    if (name = "")
        name := "AI-" FormatTime(, "HHmmss")
    try {
        WinGetPos(&gx, &gy, &gw, &gh, "ahk_id " g.Hwnd)
        clonePath := CreateCloneScript(name)
        RunClone(clonePath, name, gx + 28, gy + 28)
        SetStatus("Spawned " name ".")
    } catch as e {
        SetStatus("Clone failed: " e.Message)
    }
}

RenameInstanceToName(name) {
    global INSTANCE_LABEL, instanceLabel, g
    name := Trim(name)
    if (name = "")
        return
    INSTANCE_LABEL := name
    instanceLabel.Text := INSTANCE_LABEL
    g.Title := "AI Chat Controller - " INSTANCE_LABEL
    SetStatus("Renamed to " INSTANCE_LABEL ".")
}

DoRenameInstance(*) {
    global INSTANCE_LABEL
    result := InputBox("Rename this overlay label.", "Rename Overlay", "w320 h125", INSTANCE_LABEL)
    if (result.Result != "OK")
        return
    RenameInstanceToName(result.Value)
}

CreateCloneScript(name) {
    cloneDir := A_ScriptDir "\OverlayClones"
    DirCreate(cloneDir)
    safeName := SafeFileName(name)
    clonePath := cloneDir "\AIOverlay_" safeName ".ahk"
    FileCopy(A_ScriptFullPath, clonePath, true)
    return clonePath
}

RunClone(clonePath, name, x, y) {
    exe := A_AhkPath
    if (exe = "")
        exe := A_AhkPath
    argName := EscapeCommandArg("--name=" name)
    cmd := '"' exe '" "' clonePath '" ' argName ' --no-hotkeys --x=' x ' --y=' y
    Run(cmd)
}

SafeFileName(name) {
    clean := Trim(name)
    if (clean = "")
        clean := "AI"
    badChars := ["\", "/", ":", "*", "?", '"', "<", ">", "|", "`t", "`r", "`n"]
    for ch in badChars
        clean := StrReplace(clean, ch, "_")
    clean := RegExReplace(clean, "\s+", "_")
    clean := RegExReplace(clean, "_+", "_")
    clean := Trim(clean, "_")
    if (clean = "")
        clean := "AI"
    return SubStr(clean, 1, 48)
}

EscapeCommandArg(value) {
    value := StrReplace(value, '"', '\"')
    return '"' value '"'
}

; ── ACTION FUNCTIONS ────────────────────────────────────────
SetStatus(msg) {
    status.Text := SubStr(msg, 1, 60)
}

ActivateTarget() {
    global anchorHwnd, isAnchored
    if isAnchored && WinExist("ahk_id " anchorHwnd) {
        WinActivate("ahk_id " anchorHwnd)
        Sleep(150)
    }
}

ClickInputArea() {
    global anchorHwnd, activeProfile
    if !anchorHwnd
        return
    try {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " anchorHwnd)
        clickX := wx + (ww // 2)
        clickY := wy + wh - (activeProfile.inpH + 30)
        Click(clickX, clickY)
        Sleep(100)
    }
}

DoPasteSend(*) {
    SetStatus("Pasting + sending...")
    ActivateTarget()
    ClickInputArea()
    Send("^v")
    Sleep(300)
    Send("{Enter}")
    SetStatus("Sent clipboard.")
}

DoSend(*) {
    ActivateTarget()
    Send("{Enter}")
    SetStatus("Sent.")
}

DoVoice(*) {
    ActivateTarget()
    global anchorHwnd
    if !anchorHwnd
        return
    try {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " anchorHwnd)
        Click(wx + ww - 60, wy + wh - 45)
        SetStatus("Clicked mic.")
    }
}

DoCalibrate(*) {
    global isAnchored, anchorHwnd, activeProfile, g
    if !isAnchored || !WinExist("ahk_id " anchorHwnd) {
        TryAnchor()
        return
    }
    try {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " anchorHwnd)
        WinGetPos(&gx, &gy, &gw, &gh, "ahk_id " g.Hwnd)
        activeProfile.offR := (wx + ww) - gx
        activeProfile.offB := (wy + wh) - gy
        SetStatus("Anchor offset saved. Drag/resize, then press Set again when needed.")
    } catch as e {
        SetStatus("Anchor failed: " e.Message)
    }
}

DoToggleScroll(*) {
    global isScrolling
    isScrolling := !isScrolling
    if isScrolling {
        SetTimer(DoAutoScroll, SCROLL_INTERVAL)
        btnScroll.Text := "⏸ Stop Scroll"
        SetStatus("Auto-scrolling ON (speed " scrollSpeed ")")
    } else {
        SetTimer(DoAutoScroll, 0)
        btnScroll.Text := "⏬ AutoScroll"
        SetStatus("Auto-scroll OFF")
    }
}

DoSpeedChange(*) {
    global scrollSpeed
    val := speedCtrl.Value
    if (val != "" && IsInteger(val) && val > 0 && val <= 20)
        scrollSpeed := Integer(val)
}

JsonEscape(value) {
    value := StrReplace(value, "\", "\\")
    value := StrReplace(value, "`"", "\`"")
    value := StrReplace(value, "`r", "\r")
    value := StrReplace(value, "`n", "\n")
    value := StrReplace(value, "`t", "\t")
    return value
}

HubRequest(method, path, body := "") {
    global HUB_BASE_URL, HUB_TOKEN
    whr := ComObject("WinHttp.WinHttpRequest.5.1")
    whr.SetTimeouts(2000, 2000, 5000, 5000)
    whr.Open(method, RTrim(HUB_BASE_URL, "/") path, false)
    if (HUB_TOKEN != "")
        whr.SetRequestHeader("X-FIHUB-Token", HUB_TOKEN)
    if (body != "")
        whr.SetRequestHeader("Content-Type", "application/json")
    whr.Send(body)
    if (whr.Status < 200 || whr.Status >= 300)
        throw Error("Hub HTTP " whr.Status ": " SubStr(whr.ResponseText, 1, 120))
    return whr.ResponseText
}

HubGet(path) {
    return HubRequest("GET", path)
}

HubPost(path, body) {
    return HubRequest("POST", path, body)
}

DoHubStats(*) {
    SetStatus("Checking hub...")
    try {
        resp := HubGet("/jobs/stats")
        A_Clipboard := resp
        SetStatus("Hub OK. Stats copied.")
    } catch as e {
        SetStatus("Hub failed: " e.Message)
    }
}

DoSaveMemory(*) {
    content := A_Clipboard
    if (content = "") {
        SetStatus("Clipboard empty.")
        return
    }
    sourceWindow := ""
    try sourceWindow := WinGetTitle("A")
    body := "{`"body`":`"" JsonEscape(content) "`",`"kind`":`"text`",`"source_app`":`"ahk-controller`",`"source_window`":`"" JsonEscape(sourceWindow) "`",`"folder`":`"AI Chat`",`"tags`":`"ahk,chat`",`"pinned`":false}"
    SetStatus("Saving memory...")
    try {
        HubPost("/clipboard/save", body)
        SetStatus("Memory saved.")
    } catch as e {
        SetStatus("Memory failed: " e.Message)
    }
}

DoEndAll(*) {
    SetStatus("Stopping all agents...")
    try {
        HubPost("/top-of-mind/controls/end-all", "{}")
        SetStatus("End All sent.")
    } catch as e {
        SetStatus("End All failed: " e.Message)
    }
}

; ── FILE DROP API ───────────────────────────────────────────
DoPullFile(*) {
    SetStatus("Pulling...")
    try {
        whr := ComObject("WinHttp.WinHttpRequest.5.1")
        whr.Open("GET", FILE_DROP_URL "/list?limit=1", false)
        whr.Send()
        resp := whr.ResponseText
        if RegExMatch(resp, '"path"\s*:\s*"([^"]+)"', &m) {
            body := '{"path":"' m[1] '"}'
            whr2 := ComObject("WinHttp.WinHttpRequest.5.1")
            whr2.Open("POST", FILE_DROP_URL "/read", false)
            whr2.SetRequestHeader("Content-Type", "application/json")
            whr2.Send(body)
            A_Clipboard := whr2.ResponseText
            SetStatus("📥 " m[1] " → clip")
        } else {
            SetStatus("No files.")
        }
    } catch as e {
        SetStatus("❌ " e.Message)
    }
}

DoPushClip(*) {
    SetStatus("Pushing...")
    try {
        content := A_Clipboard
        if (content = "") {
            SetStatus("Clipboard empty.")
            return
        }
        DoAPIPush(content, "clip_" FormatTime(, "yyyyMMdd_HHmmss") ".md")
    } catch as e {
        SetStatus("❌ " e.Message)
    }
}

DoAPIPush(content, filename, source := "") {
    global SOURCE_NAME, FILE_DROP_URL
    if (source = "")
        source := SOURCE_NAME
    content := StrReplace(content, '\', '\\')
    content := StrReplace(content, '"', '\"')
    content := StrReplace(content, "`n", '\n')
    content := StrReplace(content, "`r", '')
    content := StrReplace(content, "`t", '\t')
    body := '{"filename":"' filename '","content":"' content '","source":"' source '"}'
    whr := ComObject("WinHttp.WinHttpRequest.5.1")
    whr.Open("POST", FILE_DROP_URL "/create", false)
    whr.SetRequestHeader("Content-Type", "application/json")
    whr.Send(body)
    SetStatus("📤 " filename)
}

; ── COMMAND LINE PROCESSOR ──────────────────────────────────
DoRunCmd(*) {
    global cmdInput
    raw := Trim(cmdInput.Value)
    if (raw = "")
        return
    cmdInput.Value := ""

    ; Parse command
    if (SubStr(raw, 1, 1) != "/") {
        ; No slash = just type it into the chat
        A_Clipboard := raw
        DoPasteSend()
        return
    }

    parts := StrSplit(raw, " ", , 2)
    cmd := StrLower(parts[1])
    arg := (parts.Length > 1) ? parts[2] : ""

    switch cmd {
        case "/send":
            if (arg != "") {
                A_Clipboard := arg
                DoPasteSend()
            } else {
                DoSend()
            }

        case "/paste":
            DoPasteSend()

        case "/memory":
            DoSaveMemory()

        case "/endall":
            DoEndAll()

        case "/hub":
            DoHubStats()

        case "/clone":
            if (arg != "")
                SpawnCloneByName(arg)
            else
                DoSpawnClone()

        case "/name":
            if (arg != "")
                RenameInstanceToName(arg)
            else
                DoRenameInstance()

        case "/push":
            if (arg != "") {
                ts := FormatTime(, "yyyyMMdd_HHmmss")
                DoAPIPush(arg, "cmd_" ts ".md")
            } else {
                DoPushClip()
            }

        case "/pull":
            DoPullFile()

        case "/scroll":
            DoToggleScroll()

        case "/speed":
            if (arg != "" && IsInteger(arg)) {
                global scrollSpeed := Integer(arg)
                speedCtrl.Value := arg
                SetStatus("Scroll speed: " arg)
            }

        case "/profile":
            if (arg != "" && IsInteger(arg) && Integer(arg) >= 1 && Integer(arg) <= 5)
                SwitchProfile(Integer(arg))

        case "/anchor":
            DoCalibrate()

        case "/mic":
            DoVoice()

        case "/shell":
            if (arg != "") {
                SetStatus("Running: " SubStr(arg, 1, 40))
                try {
                    shell := ComObject("WScript.Shell")
                    exec := shell.Exec("cmd.exe /c " arg)
                    output := exec.StdOut.ReadAll()
                    A_Clipboard := output
                    SetStatus("Shell done → clipboard (" StrLen(output) " chars)")
                } catch as e {
                    SetStatus("Shell error: " e.Message)
                }
            }

        case "/api":
            if (arg != "") {
                try {
                    whr := ComObject("WinHttp.WinHttpRequest.5.1")
                    whr.Open("POST", FILE_DROP_URL "/create", false)
                    whr.SetRequestHeader("Content-Type", "application/json")
                    whr.Send(arg)
                    SetStatus("API: " SubStr(whr.ResponseText, 1, 50))
                } catch as e {
                    SetStatus("API error: " e.Message)
                }
            }

        case "/list":
            try {
                whr := ComObject("WinHttp.WinHttpRequest.5.1")
                whr.Open("GET", FILE_DROP_URL "/list?limit=20", false)
                whr.Send()
                A_Clipboard := whr.ResponseText
                SetStatus("File list → clipboard")
            } catch as e {
                SetStatus("❌ " e.Message)
            }

        case "/help":
            help := "/send /paste /memory /endall /hub /clone /name /push /pull /scroll /speed /profile /anchor /mic /shell /api /list /quit"
            SetStatus(help)

        case "/quit":
            DoQuit()

        default:
            SetStatus("Unknown: " cmd " — try /help")
    }
}

DoQuit(*) {
    ExitApp()
}
