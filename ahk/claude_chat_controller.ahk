; Claude entrypoint for the shared Top-of-Mind AI Chat Controller.
; The old single-app Claude controller is preserved as:
;   claude_chat_controller.legacy.ahk

#Requires AutoHotkey v2.0
#SingleInstance Force

sharedController := A_ScriptDir "\ai_chat_controller.ahk"

if !FileExist(sharedController) {
    MsgBox("Missing shared controller:`n" sharedController, "Top-of-Mind AHK", "Iconx")
    ExitApp(1)
}

Run('"' A_AhkPath '" "' sharedController '"')
ExitApp()
