#Requires AutoHotkey v2.0+
#SingleInstance Force
Persistent

; Top of Mind AHK launcher.
; Starts the two main layers without forcing every helper into one process:
;   1. AI-HUB: SmartFix, prompts, panels, TTS/OCR utilities.
;   2. Top-of-Mind controller: AI overlay, API buttons, clipboard/API bridge.

baseDir := A_ScriptDir
hubScript := baseDir "\AHK_FIXED\AHK\AI-HUB.ahk"
controllerScript := "D:\GitHub\Top-of-Mind-API\ahk\ai_chat_controller.ahk"
smartFixScript := baseDir "\SmartFixStandalone.ahk"
cloneableOverlayScript := baseDir "\ai_chat_controller_cloneable_gui.ahk"

A_TrayMenu.Delete()
A_TrayMenu.Add("Start AI-HUB", (*) => LaunchAhk(hubScript, baseDir "\AHK_FIXED\AHK"))
A_TrayMenu.Add("Start Top-of-Mind Controller", (*) => LaunchAhk(controllerScript, "D:\GitHub\Top-of-Mind-API\ahk"))
A_TrayMenu.Add()
A_TrayMenu.Add("Start SmartFix Standalone", (*) => LaunchAhk(smartFixScript, baseDir))
A_TrayMenu.Add("Start Cloneable Overlay Test", (*) => LaunchAhk(cloneableOverlayScript, baseDir))
A_TrayMenu.Add()
A_TrayMenu.Add("Open AHK V2 Folder", (*) => Run('explorer.exe "' baseDir '"'))
A_TrayMenu.Add("Exit Launcher", (*) => ExitApp())
A_TrayMenu.Default := "Start Top-of-Mind Controller"

LaunchAhk(hubScript, baseDir "\AHK_FIXED\AHK")
LaunchAhk(controllerScript, "D:\GitHub\Top-of-Mind-API\ahk")

ToolTip("Top of Mind AHK started: AI-HUB + controller")
SetTimer(() => ToolTip(), -2200)

LaunchAhk(scriptPath, workingDir := "") {
    if !FileExist(scriptPath) {
        MsgBox("Could not find:`n" scriptPath, "Top of Mind AHK Launcher", "Iconx")
        return false
    }

    if workingDir = ""
        SplitPath(scriptPath, , &workingDir)

    try {
        Run('"' A_AhkPath '" "' scriptPath '"', workingDir)
        return true
    } catch as err {
        MsgBox("Could not launch:`n" scriptPath "`n`n" err.Message, "Top of Mind AHK Launcher", "Iconx")
        return false
    }
}
