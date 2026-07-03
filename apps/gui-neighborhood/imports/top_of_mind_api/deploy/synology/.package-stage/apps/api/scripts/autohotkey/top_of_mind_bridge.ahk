; AutoHotkey v2 bridge for the Top of Mind hub (File Intelligence Hub).
; AHK = hands (hotkeys, clipboard, focus, typing). API = brain (routing, memory, files, audit).
;
; Hotkeys:
;   Ctrl+Alt+C  — save the current clipboard and post it into Top of Mind
;   Ctrl+Alt+M  — append the current clipboard to a Markdown inbox (/operator/file-actions)
;   Ctrl+Alt+H  — health / token check against a protected endpoint (/jobs/stats)
;   Ctrl+Alt+W  — toggle automatic clipboard watching on/off
;
; The LAN API is token-protected. Set the token in the FIHUB_TOKEN environment
; variable (preferred, keeps the secret out of git) or paste it below as a fallback.

#Requires AutoHotkey v2.0

; For another machine on the LAN use: "http://192.168.2.50:10000"
HubBaseUrl := "http://127.0.0.1:10000"
HubToken := EnvGet("FIHUB_TOKEN")           ; preferred: set FIHUB_TOKEN in the environment
if !StrLen(HubToken)
    HubToken := "PASTE_TOKEN_HERE"          ; fallback only — do not commit a real token
MarkdownInbox := A_MyDocuments . "\Top of Mind\inbox.md"

^!c::PostClipboardMessage()
^!m::AppendClipboardToMarkdown()
^!h::HealthCheck()

PostClipboardMessage() {
    global HubBaseUrl
    text := A_Clipboard
    if !StrLen(text)
        return
    ClipboardSave(text)
    payload := "{"
        . "`"source_id`":`"clipboard`","
        . "`"source_label`":`"Clipboard`","
        . "`"role`":`"user`","
        . "`"folder`":`"Clipboard`","
        . "`"body`":" . JsonString(text)
        . "}"
    HttpPost(HubBaseUrl . "/top-of-mind/messages", payload)
    ToolTip("Clipboard saved + posted")
    SetTimer(() => ToolTip(), -1200)
}

AppendClipboardToMarkdown() {
    global HubBaseUrl, MarkdownInbox
    text := A_Clipboard
    if !StrLen(text)
        return
    entry := "`n`n## Clipboard " . FormatTime(, "yyyy-MM-dd HH:mm:ss") . "`n`n" . text . "`n"
    payload := "{"
        . "`"action`":`"append_text`","
        . "`"target_path`":" . JsonString(MarkdownInbox) . ","
        . "`"text`":" . JsonString(entry) . ","
        . "`"review_required`":false"
        . "}"
    HttpPost(HubBaseUrl . "/operator/file-actions", payload)
}

; Protected-endpoint probe. Confirms the base URL is reachable AND the token is valid.
HealthCheck() {
    global HubBaseUrl
    try {
        resp := HttpGet(HubBaseUrl . "/jobs/stats")
        ToolTip("Hub OK: " . SubStr(resp, 1, 120))
    } catch as e {
        ToolTip("Hub error: " . e.Message)
    }
    SetTimer(() => ToolTip(), -4000)
}

; ── HTTP helpers (WinHttp + token header) ───────────────────────────
HttpPost(url, body) {
    global HubToken
    request := ComObject("WinHttp.WinHttpRequest.5.1")
    request.Open("POST", url, false)
    request.SetRequestHeader("Content-Type", "application/json")
    request.SetRequestHeader("X-FIHUB-Token", HubToken)
    request.Send(body)
    return request.ResponseText
}

HttpGet(url) {
    global HubToken
    request := ComObject("WinHttp.WinHttpRequest.5.1")
    request.Open("GET", url, false)
    request.SetRequestHeader("X-FIHUB-Token", HubToken)
    request.Send()
    return request.ResponseText
}

; ── Next endpoints (ready to bind to hotkeys) ───────────────────────
; Route another AI/agent a message through the hub (records as pending outbound).
AgentSend(agentId, body) {
    global HubBaseUrl
    payload := "{"
        . "`"agent_id`":" . JsonString(agentId) . ","
        . "`"body`":" . JsonString(body)
        . "}"
    return HttpPost(HubBaseUrl . "/agents/send", payload)
}

; ── Clipboard shelf ─────────────────────────────────────────────────
; AHK is the watcher/hand; the hub (SQLite) is the memory. We POST entries,
; the server assigns the id and stores durable history.

ClipWatchEnabled := true            ; Ctrl+Alt+W toggles the auto-watcher
^!w::ToggleClipWatch()

ToggleClipWatch() {
    global ClipWatchEnabled
    ClipWatchEnabled := !ClipWatchEnabled
    ToolTip("Clipboard watch: " . (ClipWatchEnabled ? "ON" : "OFF"))
    SetTimer(() => ToolTip(), -1500)
}

; Fires on every Windows clipboard change. Type 1 = plain text.
OnClipboardChange(OnClipChange)

OnClipChange(dataType) {
    global ClipWatchEnabled
    if !ClipWatchEnabled
        return
    if (dataType != 1)                       ; skip images/files for now
        return
    text := A_Clipboard
    if !StrLen(text)                          ; skip empty
        return
    if IsLikelySecret(text)                   ; skip password-manager / private copies
        return
    ClipboardSave(text)
}

; Heuristic guard so we don't archive secrets. Extend as needed.
IsLikelySecret(text) {
    if (StrLen(text) > 5000)                  ; huge blobs are usually not "saves"
        return true
    app := ""
    try app := WinGetProcessName("A")
    for _, bad in ["KeePass.exe", "1Password.exe", "Bitwarden.exe", "keepassxc.exe"]
        if (app = bad)
            return true
    return false
}

; POST a clipboard entry to the hub with app/window context.
ClipboardSave(text := "") {
    global HubBaseUrl
    if !StrLen(text)
        text := A_Clipboard
    if !StrLen(text)
        return
    app := "", title := ""
    try app := WinGetProcessName("A")
    try title := WinGetTitle("A")
    payload := "{"
        . "`"body`":" . JsonString(text) . ","
        . "`"source_app`":" . JsonString(app) . ","
        . "`"source_window`":" . JsonString(title)
        . "}"
    return HttpPost(HubBaseUrl . "/clipboard/save", payload)
}

; Run a command line action through the hub (the hub records + gates it).
; Canonical endpoint is POST /operator/commands. `command` is an argv array
; (["git","status"]), and review_required defaults true so it waits for approval.
CommandRun(args*) {
    global HubBaseUrl
    parts := ""
    for _, a in args
        parts .= (parts = "" ? "" : ",") . JsonString(a)
    payload := "{"
        . "`"command`":[" . parts . "],"
        . "`"review_required`":true"
        . "}"
    return HttpPost(HubBaseUrl . "/operator/commands", payload)
}

JsonString(value) {
    output := StrReplace(value, "\", "\\")
    output := StrReplace(output, Chr(34), "\" . Chr(34))
    output := StrReplace(output, "`r", "\r")
    output := StrReplace(output, "`n", "\n")
    output := StrReplace(output, "`t", "\t")
    return Chr(34) . output . Chr(34)
}
