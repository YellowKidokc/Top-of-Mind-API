#Requires AutoHotkey v2.0+
#SingleInstance Force
#UseHook
Persistent

SmartFixApp()

class SmartFixApp {
    static Defaults := Map(
        "provider", "OpenAI",
        "openaiModel", "gpt-4o-mini",
        "claudeModel", "claude-sonnet-4-20250514"
    )

    __New() {
        this.settingsPath := A_ScriptDir "\config\settings.ini"
        this.client := SmartFixAiClient(this.settingsPath)
        Hotkey("^Space", this.HandleSmartFix.Bind(this), "On")
        A_TrayMenu.Delete()
        A_TrayMenu.Add("Smart Fix: Ctrl+Space", this.HandleSmartFix.Bind(this))
        A_TrayMenu.Add("Exit", (*) => ExitApp())
    }

    HandleSmartFix(*) {
        targetHwnd := WinExist("A")
        if !targetHwnd {
            this.ShowTip("No active window found")
            return
        }

        savedClipboard := ClipboardAll()
        A_Clipboard := ""
        Send("^a")
        Sleep(120)
        Send("^c")

        if !ClipWait(2) {
            A_Clipboard := savedClipboard
            this.ShowTip("No text found to fix")
            return
        }

        textToFix := A_Clipboard
        A_Clipboard := savedClipboard

        if StrLen(Trim(textToFix)) < 2 {
            this.ShowTip("No text found to fix")
            return
        }

        this.ShowTip("Fixing text...")
        response := this.client.FixText(textToFix)
        ToolTip()

        if this.IsError(response) {
            MsgBox(response, "Smart Fix Error", "Icon!")
            return
        }

        response := this.CleanResponse(response)
        if response = "" {
            MsgBox("Smart Fix returned an empty response.", "Smart Fix Error", "Icon!")
            return
        }

        if !WinExist("ahk_id " targetHwnd) {
            MsgBox("The original window is no longer available.", "Smart Fix Error", "Icon!")
            return
        }

        WinActivate("ahk_id " targetHwnd)
        WinWaitActive("ahk_id " targetHwnd,, 2)
        Sleep(120)

        A_Clipboard := response
        ClipWait(1)
        Send("^a")
        Sleep(120)
        Send("^v")
        Sleep(150)
        A_Clipboard := savedClipboard
        this.ShowTip("Fixed! (Ctrl+Z to undo)", 2000)
    }

    IsError(response) {
        if response = ""
            return true
        if InStr(response, "API Error")
            return true
        if InStr(response, "configure your")
            return true
        if InStr(response, "Request failed")
            return true
        if InStr(response, "timed out")
            return true
        if InStr(response, "couldn't parse")
            return true
        return false
    }

    CleanResponse(response) {
        response := Trim(response)
        if SubStr(response, 1, 1) = '"' && SubStr(response, -1) = '"'
            response := SubStr(response, 2, -1)
        fence := Chr(96) Chr(96) Chr(96)
        if SubStr(response, 1, 3) = fence {
            response := RegExReplace(response, "s)^" fence "[a-zA-Z0-9_-]*\R?", "")
            response := RegExReplace(response, "s)\R?" fence "$", "")
            response := Trim(response)
        }
        return response
    }

    ShowTip(text, duration := 1500) {
        ToolTip(text)
        SetTimer(() => ToolTip(), -duration)
    }
}

class SmartFixAiClient {
    __New(settingsPath) {
        this.settingsPath := settingsPath
    }

    FixText(textToFix) {
        prompt := this.BuildPrompt(textToFix)
        provider := this.ReadSetting("provider", SmartFixApp.Defaults["provider"])
        if provider = "Claude"
            return this.CallClaude(prompt)
        return this.CallOpenAI(prompt)
    }

    BuildPrompt(textToFix) {
        prompt := "Fix and improve this text. Correct grammar, spelling, capitalization, punctuation, and flow while preserving the original meaning and intent."
        prompt .= "`n`nCRITICAL RULES:"
        prompt .= "`n- Return ONLY the corrected text."
        prompt .= "`n- Do not include explanations, quotes, markdown, labels, or prefaces."
        prompt .= "`n- Do not modify, remove, or alter URLs, file paths, email addresses, IP addresses, code identifiers, or technical IDs."
        prompt .= "`n- Keep links and paths exactly as they appear."
        prompt .= "`n- Only correct the natural language prose around protected technical text."
        prompt .= "`n`nTEXT TO FIX:"
        prompt .= "`n" textToFix
        return prompt
    }

    CallOpenAI(prompt) {
        apiKey := this.ReadSetting("openaiKey", "")
        if apiKey = ""
            apiKey := this.ReadSetting("apiKey", "")
        if apiKey = ""
            apiKey := EnvGet("OPENAI_API_KEY")
        if apiKey = ""
            return "Please configure your OpenAI API key in config\settings.ini or OPENAI_API_KEY."

        model := this.ReadSetting("openaiModel", SmartFixApp.Defaults["openaiModel"])
        if model = ""
            model := EnvGet("OPENAI_MODEL")
        if model = ""
            model := SmartFixApp.Defaults["openaiModel"]

        body := '{"model":"' model '","max_tokens":4000,"messages":[{"role":"user","content":"' this.EscapeJSON(prompt) '"}]}'
        try {
            whr := ComObject("WinHttp.WinHttpRequest.5.1")
            whr.SetTimeouts(5000, 5000, 15000, 120000)
            whr.Open("POST", "https://api.openai.com/v1/chat/completions", true)
            whr.SetRequestHeader("Content-Type", "application/json")
            whr.SetRequestHeader("Authorization", "Bearer " apiKey)
            whr.Send(body)
            if !whr.WaitForResponse(120)
                return "Request failed: AI request timed out."
            responseText := whr.ResponseText
            if RegExMatch(responseText, '"content"\s*:\s*"((?:[^"\\]|\\.)*)"', &match)
                return this.UnescapeJSON(match[1])
            if RegExMatch(responseText, '"message"\s*:\s*"([^"]*)"', &errMatch)
                return "API Error: " this.UnescapeJSON(errMatch[1])
            return "Response received but couldn't parse."
        } catch as err {
            return "Request failed: " err.Message
        }
    }

    CallClaude(prompt) {
        apiKey := this.ReadSetting("claudeKey", "")
        if apiKey = ""
            apiKey := EnvGet("ANTHROPIC_API_KEY")
        if apiKey = ""
            return "Please configure your Claude API key in config\settings.ini or ANTHROPIC_API_KEY."

        model := this.ReadSetting("claudeModel", SmartFixApp.Defaults["claudeModel"])
        if model = ""
            model := EnvGet("ANTHROPIC_MODEL")
        if model = ""
            model := SmartFixApp.Defaults["claudeModel"]

        body := '{"model":"' model '","max_tokens":4000,"messages":[{"role":"user","content":"' this.EscapeJSON(prompt) '"}]}'
        try {
            whr := ComObject("WinHttp.WinHttpRequest.5.1")
            whr.SetTimeouts(5000, 5000, 15000, 120000)
            whr.Open("POST", "https://api.anthropic.com/v1/messages", true)
            whr.SetRequestHeader("Content-Type", "application/json")
            whr.SetRequestHeader("x-api-key", apiKey)
            whr.SetRequestHeader("anthropic-version", "2023-06-01")
            whr.Send(body)
            if !whr.WaitForResponse(120)
                return "Request failed: AI request timed out."
            responseText := whr.ResponseText
            if RegExMatch(responseText, '"text"\s*:\s*"((?:[^"\\]|\\.)*)"', &match)
                return this.UnescapeJSON(match[1])
            if RegExMatch(responseText, '"message"\s*:\s*"([^"]*)"', &errMatch)
                return "API Error: " this.UnescapeJSON(errMatch[1])
            return "Response received but couldn't parse."
        } catch as err {
            return "Request failed: " err.Message
        }
    }

    ReadSetting(key, fallback := "") {
        if FileExist(this.settingsPath) {
            try {
                value := IniRead(this.settingsPath, "Settings", key, fallback)
                return value
            }
        }
        return fallback
    }

    EscapeJSON(str) {
        str := StrReplace(str, "\", "\\")
        str := StrReplace(str, '"', '\"')
        str := StrReplace(str, "`n", "\n")
        str := StrReplace(str, "`r", "\r")
        str := StrReplace(str, "`t", "\t")
        return str
    }

    UnescapeJSON(str) {
        str := StrReplace(str, "\n", "`n")
        str := StrReplace(str, "\r", "`r")
        str := StrReplace(str, "\t", "`t")
        str := StrReplace(str, '\"', '"')
        str := StrReplace(str, "\\", "\")
        return str
    }
}
