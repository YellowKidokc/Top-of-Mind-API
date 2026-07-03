; Compatibility entrypoint for the unified Top-of-Mind AHK controller.
; The old standalone bridge is preserved as:
;   top_of_mind_bridge.legacy.ahk

#Requires AutoHotkey v2.0
#SingleInstance Force

sharedController := A_ScriptDir "\..\..\..\..\ahk\ai_chat_controller.ahk"

if !FileExist(sharedController) {
    MsgBox("Missing shared controller:`n" sharedController, "Top-of-Mind AHK", "Iconx")
    ExitApp(1)
}

Run('"' A_AhkPath '" "' sharedController '"')
ExitApp()
