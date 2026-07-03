# AutoHotkey Controllers

This folder holds AutoHotkey scripts that act as the local "hands" for Top of Mind.

Current purpose:

- control AI/chat windows
- type messages from the API into target apps
- click send/start/stop buttons
- capture clipboard or window text
- post results back to the hub

Current files:

- `ai_chat_controller.ahk`: unified controller and bridge. This is the one real AHK service.
- `claude_chat_controller.ahk`: compatibility launcher for `ai_chat_controller.ahk`.
- `claude_chat_controller.legacy.ahk`: old standalone Claude controller backup.
- `AI Chat Controller - Complete Operations Guide.md`: operating guide.

The old API bridge entrypoint at:

```text
apps/api/scripts/autohotkey/top_of_mind_bridge.ahk
```

now also launches the unified controller. Its old standalone implementation is
saved beside it as `top_of_mind_bridge.legacy.ahk`.

## Canonical Hotkeys

The controller uses `Ctrl+Alt+Shift` for overlay/hub commands so it does not
fight browser tab switching, AI-HUB, or comms hotkeys.

```text
Ctrl+Alt+Shift+V       paste clipboard into active AI and send
Ctrl+Alt+Shift+Enter   send Enter to active AI
Ctrl+Alt+Shift+R       pull latest File Drop item
Ctrl+Alt+Shift+M       click/toggle mic area
Ctrl+Alt+Shift+P       push clipboard to old File Drop API
Ctrl+Alt+Shift+B       recalibrate active window anchor
Ctrl+Alt+Shift+S       toggle auto-scroll
Ctrl+Alt+Shift+C       save clipboard to hub + stream message
Ctrl+Alt+Shift+H       hub health check
Ctrl+Alt+Shift+A       queue clipboard to active AI via /agents/send
Ctrl+Alt+Shift+X       end-all hub control
Ctrl+Alt+Shift+W       toggle clipboard watcher
Ctrl+Alt+Shift+1-5     switch AI profile
```

Quit is button-only.

Default hub URL should follow the numbering schema:

```text
http://127.0.0.1:10000
```

On another computer, use the hub machine IP:

```text
http://192.168.2.50:10000
```

AutoHotkey should stay the hands. Routing, memory, security, and file decisions should stay in `apps/api`.
