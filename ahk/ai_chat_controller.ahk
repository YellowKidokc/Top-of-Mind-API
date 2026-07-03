; ============================================================
; AI Chat Controller v2 â€” AutoHotkey v2
; Window-anchored overlay with per-app profiles,
; auto-scroll, and a command line.
;
; PROFILES: Claude, Kimi, Codex, TypingMind, GPT (Ctrl+1-5)
;
; HOTKEYS:
;   Ctrl+Shift+V  â€” Paste clipboard into chat + send
;   Ctrl+Shift+R  â€” Pull latest file from File Drop API
;   Ctrl+Shift+S  â€” Send (Enter)
;   Ctrl+Shift+M  â€” Click mic/voice area
;   Ctrl+Shift+P  â€” Push clipboard â†’ File Drop API
;   Ctrl+Shift+B  â€” Recalibrate anchor
;   Ctrl+Shift+A  â€” Toggle auto-scroll
;   Ctrl+Shift+Q  â€” Quit
;   Ctrl+1-5      â€” Switch profile
;
; COMMAND LINE (type in the box at bottom):
;   /send <text>     â€” Type text into chat + send
;   /paste            â€” Paste clipboard into chat
;   /push <text>      â€” Push text to File Drop API as .md
;   /pull             â€” Pull latest file from drop â†’ clipboard
;   /scroll           â€” Toggle auto-scroll
;   /speed <n>        â€” Set scroll speed (1=slow, 10=fast)
;   /profile <1-5>    â€” Switch profile
;   /anchor           â€” Recalibrate
;   /mic              â€” Toggle voice
;   /shell <cmd>      â€” Run a shell command, result â†’ clipboard
;   /api <json>       â€” POST raw JSON to File Drop /create
;   /list             â€” List files in drop folder â†’ clipboard
;   /quit             â€” Exit
; ============================================================

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; â”€â”€ CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
HUB_BASE_URL := EnvGet("FIHUB_BASE_URL")
if (HUB_BASE_URL = "")
    HUB_BASE_URL := "http://127.0.0.1:10000"
FIHUB_TOKEN := EnvGet("FIHUB_TOKEN")
FILE_DROP_URL := "http://localhost:8100/file-drop"
SOURCE_NAME  := "ahk-controller"
FOLLOW_INTERVAL := 100
SCROLL_INTERVAL := 80
scrollSpeed := 3  ; lines per tick
isScrolling := false
frameVisible := false
wideMode := false
overlayW := 336
overlayH := 158
frameL := 32
frameT := 96
frameR := 32
frameB := 118
MarkdownInbox := A_MyDocuments . "\Top of Mind\inbox.md"
ClipWatchEnabled := false

; â”€â”€ APP PROFILES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    Profile("Claude",  "chrome.exe", "Claude",      420, 220, 600, 50),
    Profile("Kimmy",   "Kimi.exe",   "kimi-desktop", 420, 420, 600, 50),
    Profile("Codex",   "Codex.exe",  "Codex",       420, 200, 700, 110),
    Profile("TopMind", "msedge.exe", "Top of Mind", 420, 420, 700, 72),
    Profile("GPT",     "chrome.exe", "ChatGPT",     420, 220, 600, 50),
]

activeIdx := 2
activeProfile := profiles[activeIdx]
isAnchored := false
anchorHwnd := 0

; â”€â”€ GUI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
g := Gui("+AlwaysOnTop +ToolWindow -Caption +Resize +Border")
g.BackColor := "14171e"
g.MarginX := 5
g.MarginY := 3

g.SetFont("s7 c" "e9e6dd", "Segoe UI")
btnWide  := g.Add("Button", "x5 y1 w48 h20", "Wide")
btnFrame := g.Add("Button", "x56 y1 w52 h20", "Frame")
btnHub   := g.Add("Button", "x111 y1 w46 h20", "Hub")
btnClip  := g.Add("Button", "x160 y1 w48 h20", "Clip")
btnAgent := g.Add("Button", "x211 y1 w52 h20", "Agent")
btnEnd   := g.Add("Button", "x266 y1 w45 h20", "Stop")

; â”€â”€ Row 1: Profile buttons â”€â”€
g.SetFont("s7 Bold c" "d9a441", "Consolas")
g.Add("Text", "x5 y25 w30 h16", "APP:")

g.SetFont("s7 c" "e9e6dd", "Consolas")
profileBtns := []
xp := 38
for idx, p in profiles {
    btn := g.Add("Button", "x" xp " y23 w50 h18", p.name)
    btn.OnEvent("Click", MakeProfileSwitcher(idx))
    profileBtns.Push(btn)
    xp += 52
}

; â”€â”€ Row 2: Anchor status â”€â”€
g.SetFont("s7 c" "5fb3ae", "Consolas")
anchorLabel := g.Add("Text", "x5 y44 w326 h13", "Not anchored - Ctrl+Alt+Shift+B")

; â”€â”€ Row 3: Action buttons â”€â”€
g.SetFont("s8 c" "e9e6dd", "Segoe UI")
y3 := 59
btnPaste  := g.Add("Button", "x5   y" y3 " w65 h26", "Paste")
btnSend   := g.Add("Button", "x73  y" y3 " w55 h26", "Send")
btnPull   := g.Add("Button", "x131 y" y3 " w55 h26", "Pull")
btnPush   := g.Add("Button", "x189 y" y3 " w55 h26", "Push")
btnMic    := g.Add("Button", "x247 y" y3 " w40 h26", "Mic")

; â”€â”€ Row 4: Scroll + Anchor â”€â”€
y4 := 87
btnScroll := g.Add("Button", "x5   y" y4 " w90 h26", "AutoScroll")
g.SetFont("s7 c" "9aa1b0", "Consolas")
g.Add("Text", "x100 y" (y4+6) " w30 h16", "Spd:")
speedCtrl := g.Add("Edit", "x132 y" (y4+3) " w30 h20 Number Center", String(scrollSpeed))
speedCtrl.SetFont("s7 c" "e9e6dd", "Consolas")
btnCalib  := g.Add("Button", "x170 y" y4 " w60 h26", "Anchor")
btnQuit   := g.Add("Button", "x237 y" y4 " w50 h26", "Quit")

; â”€â”€ Row 5: Command line â”€â”€
y5 := 117
g.SetFont("s7 c" "d9a441", "Consolas")
g.Add("Text", "x5 y" (y5+3) " w12 h16", ">")
g.SetFont("s8 c" "e9e6dd", "Consolas")
cmdInput := g.Add("Edit", "x18 y" y5 " w276 h22 Background" "1a1e26", "")
g.SetFont("s8 c" "e9e6dd", "Segoe UI")
btnRun := g.Add("Button", "x298 y" y5 " w28 h22", "Run")

; â”€â”€ Row 6: Status â”€â”€
g.SetFont("s6 c" "6a7080", "Consolas")
status := g.Add("Text", "x5 y143 w326 h12", "Ready. Type /help in the command line.")

; â”€â”€ Wire events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
btnWide.OnEvent("Click", DoToggleWide)
btnFrame.OnEvent("Click", DoToggleFrame)
btnHub.OnEvent("Click", DoHubHealth)
btnClip.OnEvent("Click", DoSaveClipHub)
btnAgent.OnEvent("Click", DoAgentSendClip)
btnEnd.OnEvent("Click", DoEndAllHub)
btnPaste.OnEvent("Click", DoPasteSend)
btnSend.OnEvent("Click", DoSend)
btnPull.OnEvent("Click", DoPullFile)
btnPush.OnEvent("Click", DoPushClip)
btnMic.OnEvent("Click", DoVoice)
btnScroll.OnEvent("Click", DoToggleScroll)
btnCalib.OnEvent("Click", DoCalibrate)
btnQuit.OnEvent("Click", DoQuit)
btnRun.OnEvent("Click", DoRunCmd)

speedCtrl.OnEvent("Change", DoSpeedChange)

g.OnEvent("Close", DoQuit)
g.OnEvent("Size", DoGuiSize)
g.Title := "AI Chat Controller"
g.Show("w336 h158 x100 y100")
SetTimer(DoCalibrate, -700)

frame := Gui("+AlwaysOnTop +ToolWindow -Caption +E0x20 +Border")
frame.BackColor := "05070b"
frame.MarginX := 0
frame.MarginY := 0
frame.SetFont("s1 c" "5fb3ae", "Segoe UI")
frame.Add("Text", "x0 y0 w10 h10", "")

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

; â”€â”€ TIMERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SetTimer(FollowTarget, FOLLOW_INTERVAL)
OnClipboardChange(OnClipChange)

FollowTarget() {
    global isAnchored, anchorHwnd, activeProfile, g, frame, frameVisible, wideMode, overlayW, overlayH
    if !isAnchored
        return
    if !WinExist("ahk_id " anchorHwnd) {
        isAnchored := false
        anchorLabel.Text := "Window lost"
        return
    }
    try {
        WinGetPos(&wx, &wy, &ww, &wh, "ahk_id " anchorHwnd)
        if wideMode {
            overlayW := ww - 80
            if (overlayW < 520)
                overlayW := 520
            if (overlayW > 1100)
                overlayW := 1100
            newX := wx + ((ww - overlayW) // 2)
            ResizeControlBar(overlayW)
        } else {
            newX := wx + ww - activeProfile.offR
        }
        newY := wy + wh - activeProfile.offB
        if (newX < 8)
            newX := 8
        if (newY < 8)
            newY := 8
        maxX := A_ScreenWidth - overlayW - 8
        maxY := A_ScreenHeight - overlayH - 8
        if (newX > maxX)
            newX := maxX
        if (newY > maxY)
            newY := maxY
        g.Move(newX, newY)
        if frameVisible
            MoveFrame(wx, wy, ww, wh)
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

; â”€â”€ PROFILE SWITCHING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            anchorLabel.Text := activeProfile.name " (" ww "x" wh ")"
        }
    } else {
        isAnchored := false
        anchorLabel.Text := activeProfile.name " not found"
    }
}

; â”€â”€ HOTKEYS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
^!+v::DoPasteSend()
^!+Enter::DoSend()
^!+r::DoPullFile()
^!+m::DoVoice()
^!+p::DoPushClip()
^!+b::DoCalibrate()
^!+s::DoToggleScroll()
^!+c::PostClipboardMessage()
^!+h::DoHubHealth()
^!+a::DoAgentSendClip()
^!+x::DoEndAllHub()
^!+w::ToggleClipWatch()
^!+1::SwitchProfile(1)
^!+2::SwitchProfile(2)
^!+3::SwitchProfile(3)
^!+4::SwitchProfile(4)
^!+5::SwitchProfile(5)

; â”€â”€ ACTION FUNCTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SetStatus(msg) {
    status.Text := SubStr(msg, 1, 60)
}

DoGuiSize(guiObj, minMax, width, height) {
    if (minMax = -1)
        return
    ResizeControlBar(width)
}

ResizeControlBar(width) {
    global cmdInput, btnRun, status, anchorLabel
    if (width < 336)
        width := 336
    try {
        anchorLabel.Move(5, 44, width - 10, 13)
        cmdInput.Move(18, 117, width - 60, 22)
        btnRun.Move(width - 38, 117, 28, 22)
        status.Move(5, 143, width - 10, 12)
    }
}

MoveFrame(wx, wy, ww, wh) {
    global frame, frameL, frameT, frameR, frameB
    fx := wx + frameL
    fy := wy + frameT
    fw := ww - frameL - frameR
    fh := wh - frameT - frameB
    if (fw < 200)
        fw := 200
    if (fh < 120)
        fh := 120
    frame.Show("NA x" fx " y" fy " w" fw " h" fh)
}

DoToggleWide(*) {
    global wideMode, btnWide, g, overlayW, overlayH
    wideMode := !wideMode
    if wideMode {
        btnWide.Text := "Dock"
        overlayW := 760
        overlayH := 158
        g.Show("w" overlayW " h" overlayH)
        SetStatus("Wide mode on.")
    } else {
        btnWide.Text := "Wide"
        overlayW := 336
        overlayH := 158
        g.Show("w" overlayW " h" overlayH)
        SetStatus("Compact mode.")
    }
    FollowTarget()
}

DoToggleFrame(*) {
    global frameVisible, btnFrame, frame
    frameVisible := !frameVisible
    if frameVisible {
        btnFrame.Text := "Hide"
        SetStatus("Frame on.")
        FollowTarget()
    } else {
        btnFrame.Text := "Frame"
        frame.Hide()
        SetStatus("Frame off.")
    }
}

HttpGet(path) {
    global HUB_BASE_URL, FIHUB_TOKEN
    whr := ComObject("WinHttp.WinHttpRequest.5.1")
    whr.Open("GET", HUB_BASE_URL path, false)
    if (FIHUB_TOKEN != "")
        whr.SetRequestHeader("X-FIHUB-Token", FIHUB_TOKEN)
    whr.Send()
    return whr.ResponseText
}

HttpPost(path, body) {
    global HUB_BASE_URL, FIHUB_TOKEN
    whr := ComObject("WinHttp.WinHttpRequest.5.1")
    whr.Open("POST", HUB_BASE_URL path, false)
    whr.SetRequestHeader("Content-Type", "application/json")
    if (FIHUB_TOKEN != "")
        whr.SetRequestHeader("X-FIHUB-Token", FIHUB_TOKEN)
    whr.Send(body)
    return whr.ResponseText
}

JsonEscape(text) {
    text := StrReplace(text, "\", "\\")
    text := StrReplace(text, '"', '\"')
    text := StrReplace(text, "`r", "")
    text := StrReplace(text, "`n", "\n")
    text := StrReplace(text, "`t", "\t")
    return text
}

DoHubHealth(*) {
    try {
        resp := HttpGet("/jobs/stats")
        SetStatus("Hub OK: " SubStr(resp, 1, 48))
    } catch as e {
        SetStatus("Hub error: " e.Message)
    }
}

DoSaveClipHub(*) {
    global SOURCE_NAME, activeProfile
    content := A_Clipboard
    if (content = "") {
        SetStatus("Clipboard empty.")
        return
    }
    try {
        body := '{"body":"' JsonEscape(content) '","kind":"text","source_app":"' SOURCE_NAME '","source_window":"' activeProfile.name '","folder":"AI Chat","tags":"ahk,chat","pinned":false}'
        HttpPost("/clipboard/save", body)
        msg := '{"source_id":"ahk","source_label":"AutoHotkey","body":"' JsonEscape(content) '","role":"user","folder":"Clipboard","wall":"main","metadata":{"via":"ai_chat_controller"}}'
        HttpPost("/top-of-mind/messages", msg)
        SetStatus("Saved clipboard to hub.")
    } catch as e {
        SetStatus("Clip save error: " e.Message)
    }
}

DoAgentSendClip(*) {
    global activeProfile
    content := A_Clipboard
    if (content = "") {
        SetStatus("Clipboard empty.")
        return
    }
    try {
        agentId := StrLower(activeProfile.name)
        body := '{"agent_id":"' agentId '","body":"' JsonEscape(content) '","from_id":"operator-ahk","from_label":"Operator AHK","folder":"Outbound","wall":"main","metadata":{"via":"ai_chat_controller"}}'
        HttpPost("/agents/send", body)
        SetStatus("Queued clipboard for " activeProfile.name ".")
    } catch as e {
        SetStatus("Agent send error: " e.Message)
    }
}

DoEndAllHub(*) {
    try {
        HttpPost("/top-of-mind/controls/end-all", "{}")
        SetStatus("Hub stop-all sent.")
    } catch as e {
        SetStatus("Stop-all error: " e.Message)
    }
}

PostClipboardMessage(*) {
    content := A_Clipboard
    if (content = "") {
        SetStatus("Clipboard empty.")
        return
    }
    try {
        ClipboardSave(content)
        msg := '{"source_id":"clipboard","source_label":"Clipboard","body":"' JsonEscape(content) '","role":"user","folder":"Clipboard","wall":"main","metadata":{"via":"ahk_unified_bridge"}}'
        HttpPost("/top-of-mind/messages", msg)
        SetStatus("Clipboard saved + streamed.")
    } catch as e {
        SetStatus("Clipboard post error: " e.Message)
    }
}

AppendClipboardToMarkdown(*) {
    global MarkdownInbox
    content := A_Clipboard
    if (content = "") {
        SetStatus("Clipboard empty.")
        return
    }
    entry := "`n`n## Clipboard " FormatTime(, "yyyy-MM-dd HH:mm:ss") "`n`n" content "`n"
    try {
        payload := '{"action":"append_text","target_path":"' JsonEscape(MarkdownInbox) '","text":"' JsonEscape(entry) '","review_required":false,"metadata":{"via":"ahk_unified_bridge"}}'
        HttpPost("/operator/file-actions", payload)
        SetStatus("Appended clipboard to inbox.md.")
    } catch as e {
        SetStatus("Markdown append error: " e.Message)
    }
}

ToggleClipWatch(*) {
    global ClipWatchEnabled
    ClipWatchEnabled := !ClipWatchEnabled
    SetStatus("Clipboard watch: " (ClipWatchEnabled ? "ON" : "OFF"))
}

OnClipChange(dataType) {
    global ClipWatchEnabled
    if !ClipWatchEnabled
        return
    if (dataType != 1)
        return
    content := A_Clipboard
    if (content = "")
        return
    if IsLikelySecret(content)
        return
    try ClipboardSave(content)
}

IsLikelySecret(text) {
    if (StrLen(text) > 5000)
        return true
    app := ""
    try app := WinGetProcessName("A")
    for _, bad in ["KeePass.exe", "1Password.exe", "Bitwarden.exe", "keepassxc.exe"]
        if (app = bad)
            return true
    return false
}

ClipboardSave(text := "") {
    if (text = "")
        text := A_Clipboard
    if (text = "")
        return ""
    app := "", title := ""
    try app := WinGetProcessName("A")
    try title := WinGetTitle("A")
    payload := '{"body":"' JsonEscape(text) '","kind":"text","source_app":"' JsonEscape(app) '","source_window":"' JsonEscape(title) '","folder":"Clipboard","tags":"ahk,watcher","pinned":false}'
    return HttpPost("/clipboard/save", payload)
}

CommandRun(args*) {
    parts := ""
    for _, a in args
        parts .= (parts = "" ? "" : ",") '"' JsonEscape(a) '"'
    payload := '{"command":[' parts '],"review_required":true,"metadata":{"via":"ahk_unified_bridge"}}'
    return HttpPost("/operator/commands", payload)
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
    TryAnchor()
}

DoToggleScroll(*) {
    global isScrolling
    isScrolling := !isScrolling
    if isScrolling {
        SetTimer(DoAutoScroll, SCROLL_INTERVAL)
        btnScroll.Text := "Stop Scroll"
        SetStatus("Auto-scrolling ON (speed " scrollSpeed ")")
    } else {
        SetTimer(DoAutoScroll, 0)
        btnScroll.Text := "AutoScroll"
        SetStatus("Auto-scroll OFF")
    }
}

DoSpeedChange(*) {
    global scrollSpeed
    val := speedCtrl.Value
    if (val != "" && IsInteger(val) && val > 0 && val <= 20)
        scrollSpeed := Integer(val)
}

; â”€â”€ FILE DROP API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            SetStatus("ðŸ“¥ " m[1] " â†’ clip")
        } else {
            SetStatus("No files.")
        }
    } catch as e {
        SetStatus("âŒ " e.Message)
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
        SetStatus("âŒ " e.Message)
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
    SetStatus("ðŸ“¤ " filename)
}

; â”€â”€ COMMAND LINE PROCESSOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

        case "/push":
            if (arg != "") {
                ts := FormatTime(, "yyyyMMdd_HHmmss")
                DoAPIPush(arg, "cmd_" ts ".md")
            } else {
                DoPushClip()
            }

        case "/pull":
            DoPullFile()

        case "/clip":
            if (arg = "" || StrLower(arg) = "save")
                PostClipboardMessage()
            else if (StrLower(arg) = "watch")
                ToggleClipWatch()
            else
                SetStatus("Try /clip save or /clip watch")

        case "/agent":
            if (arg != "") {
                spaceAt := InStr(arg, " ")
                if (spaceAt > 1) {
                    agentId := SubStr(arg, 1, spaceAt - 1)
                    bodyText := SubStr(arg, spaceAt + 1)
                    oldClip := A_Clipboard
                    A_Clipboard := bodyText
                    try {
                        payload := '{"agent_id":"' JsonEscape(agentId) '","body":"' JsonEscape(bodyText) '","from_id":"operator-ahk","from_label":"Operator AHK","folder":"Outbound","wall":"main","metadata":{"via":"ahk_command_line"}}'
                        HttpPost("/agents/send", payload)
                        SetStatus("Queued for " agentId ".")
                    }
                    A_Clipboard := oldClip
                } else {
                    SetStatus("Use /agent claude message")
                }
            } else {
                DoAgentSendClip()
            }

        case "/hub":
            DoHubHealth()

        case "/watch":
            ToggleClipWatch()

        case "/md":
            AppendClipboardToMarkdown()

        case "/run":
            if (arg != "") {
                CommandRun("cmd.exe", "/c", arg)
                SetStatus("Command job queued for review.")
            }

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
                try {
                    CommandRun("cmd.exe", "/c", arg)
                    SetStatus("Shell command queued for review.")
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
                SetStatus("File list â†’ clipboard")
            } catch as e {
                SetStatus("âŒ " e.Message)
            }

        case "/help":
            help := "/send /paste /clip /agent /hub /watch /md /run /pull /scroll /profile /anchor /mic"
            SetStatus(help)

        case "/quit":
            DoQuit()

        default:
            SetStatus("Unknown: " cmd " â€” try /help")
    }
}

DoQuit(*) {
    ExitApp()
}
