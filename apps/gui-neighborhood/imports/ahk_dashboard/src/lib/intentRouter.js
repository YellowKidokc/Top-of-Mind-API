// /lib/intentRouter.js
export async function handleIntent(intent, text) {
  switch (intent) {
    case "wake":
      return "Ready. Say a command like: run sync, open strategy, or stop.";
    case "runSync": {
      try {
        const res = await fetch("/api/emma-sync", { method: "POST" });
        if (!res.ok) throw new Error("sync_failed");
        return "Synchronization complete, Ash. Memory and logs are up to date.";
      } catch {
        return "I tried to sync but something failed. Check the network and try again.";
      }
    }
    case "startListening":
      return "I am already listening.";
    case "stop":
      return "Stopping now.";
    case "help":
      return "You can say: run sync, open strategy, open marketing pulse, or stop.";
    default:
      return "I didn't catch a supported command. Say help to hear the options.";
  }
}
