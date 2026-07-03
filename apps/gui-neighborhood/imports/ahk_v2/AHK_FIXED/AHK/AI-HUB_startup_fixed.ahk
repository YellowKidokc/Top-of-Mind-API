#Requires AutoHotkey v2.0+
#SingleInstance Force

hubScript := A_ScriptDir "\AI-HUB.ahk"
commanderBat := "D:\DONT TOUCH BOOT UP\Codex-Powershell_GUI\start_commander.bat"

if FileExist(hubScript) {
    Run('"' A_AhkPath '" "' hubScript '"', A_ScriptDir)
} else if FileExist(commanderBat) {
    Run('"' commanderBat '"', "D:\DONT TOUCH BOOT UP\Codex-Powershell_GUI", "Hide")
} else {
    MsgBox("Could not find AI-HUB or Script Hub launcher.", "AI-HUB Startup", "Iconx")
}
