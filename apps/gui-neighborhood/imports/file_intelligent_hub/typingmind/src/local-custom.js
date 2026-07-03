(function () {
  const localName = "Top of Mind";
  const storageKey = "topOfMindInbox:v1";
  const settingsKey = "topOfMindSettings:v1";
  const sources = ["Codex", "Kimi", "ChatGPT", "Claude", "TypingMind", "Clipboard", "Note"];
  const folders = ["Main", "Research", "Code", "Faith", "Media", "Clipboard"];
  const sourceLabels = {
    Codex: "C",
    Kimi: "K",
    ChatGPT: "G",
    Claude: "Cl",
    TypingMind: "T",
    Clipboard: "Cb",
    Note: "N"
  };
  const hiddenTextPatterns = [
    /buy a license/i,
    /50%\s*off/i,
    /unlock all premium features/i,
    /get a lifetime license/i
  ];

  function setTitle() {
    document.title = localName + " - AI Command Desk";
  }

  async function clearStaticAppCache() {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    if ("caches" in window) {
      const names = await caches.keys();
      for (const name of names) {
        await caches.delete(name);
      }
    }
  }

  function hideUpsells() {
    const candidates = document.querySelectorAll("button, a, [role='button']");
    for (const node of candidates) {
      const text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (hiddenTextPatterns.some((pattern) => pattern.test(text))) {
        node.setAttribute("data-local-hidden", "true");
      }
    }
  }

  function quietOnboarding() {
    const textNodes = Array.from(document.querySelectorAll("button, section, aside, div"));
    for (const node of textNodes) {
      const text = (node.textContent || "").replace(/\s+/g, " ").trim();
      if (/Welcome to TypingMind/i.test(text) && /Enter API key to chat/i.test(text)) {
        const closeButton = Array.from(node.querySelectorAll("button")).find((button) =>
          /close/i.test(button.getAttribute("aria-label") || button.textContent || "")
        );
        if (closeButton) {
          closeButton.click();
        } else {
          node.setAttribute("data-local-hidden", "true");
        }
        break;
      }
    }
  }

  function applyLocalCustomizations() {
    setTitle();
    hideUpsells();
    quietOnboarding();
    ensureRail();
  }

  function readItems() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }

  function writeItems(items) {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

  function readSettings() {
    const defaults = {
      paused: false,
      levelFloor: 3,
      activeWall: "all",
      activeFolder: "Main",
      muted: {},
      activeSources: Object.fromEntries(sources.map((source) => [source, true]))
    };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey) || "{}") };
    } catch {
      return defaults;
    }
  }

  function writeSettings(settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }

  function priorityFromLevel(level) {
    if (level >= 5) return "critical";
    if (level >= 4) return "high";
    if (level <= 2) return "low";
    return "normal";
  }

  function addItem(text, source, priority, level) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return;
    const settings = readSettings();
    const itemSource = source || "Inbox";
    const itemLevel = Number(level || 3);
    if (settings.paused || settings.muted[itemSource]) return;
    const items = readItems();
    items.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      text: trimmed,
      source: itemSource,
      priority: priority || priorityFromLevel(itemLevel),
      level: itemLevel,
      wall: 1,
      folder: settings.activeFolder || "Main",
      selected: itemLevel >= settings.levelFloor,
      createdAt: new Date().toISOString()
    });
    writeItems(items.slice(0, 200));
    renderRail();
  }

  function getSelectedItems() {
    return readItems().filter((item) => item.selected);
  }

  function selectedText() {
    const groups = getSelectedItems()
      .slice()
      .reverse()
      .reduce((acc, item) => {
        const wall = item.wall || 1;
        if (!acc[wall]) acc[wall] = [];
        acc[wall].push(`[${item.source} | L${item.level || 3} | ${item.priority}]\n${item.text}`);
        return acc;
      }, {});

    return [1, 2, 3]
      .filter((wall) => groups[wall]?.length)
      .map((wall) => `WALL ${wall}\n${groups[wall].join("\n\n---\n\n")}`)
      .join("\n\n=======\n\n");
  }

  function insertIntoChatInput(text) {
    const input =
      document.querySelector("#chat-input-textbox") ||
      document.querySelector("textarea") ||
      document.querySelector("[contenteditable='true']");
    if (!input) return false;
    input.focus();
    if (input.isContentEditable) {
      document.execCommand("insertText", false, text);
    } else {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return true;
  }

  function ensureRail() {
    if (document.getElementById("top-of-mind-rail")) return;
    document.body.classList.add("tom-rail-closed");

    const toggle = document.createElement("button");
    toggle.id = "tom-toggle";
    toggle.type = "button";
    toggle.textContent = "Open";
    toggle.title = "Toggle Top of Mind inbox";
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("tom-rail-closed");
      document.body.classList.toggle("tom-rail-open");
    });
    document.body.appendChild(toggle);

    const dock = document.createElement("div");
    dock.id = "top-of-mind-dock";
    dock.innerHTML = `
      <div class="tom-dock-sources">
        ${sources.map((source) => `<button class="tom-dock-source" data-tom-action="source-focus" data-source-name="${source}" data-short="${sourceLabels[source]}" title="${source}">${source}</button>`).join("")}
      </div>
    `;
    document.body.appendChild(dock);

    const commandBar = document.createElement("div");
    commandBar.id = "top-of-mind-command-bar";
    commandBar.innerHTML = `
      <select class="tom-command-select" data-tom-folder>
        ${folders.map((folder) => `<option>${folder}</option>`).join("")}
      </select>
      <button class="tom-command-button" data-tom-action="open-rail">Panel</button>
      <button class="tom-command-button" data-tom-action="combine">Combine</button>
      <button class="tom-command-button" data-tom-action="split-three">Split 3</button>
      <button class="tom-command-button" data-tom-action="set-active-wall" data-wall="1">W1</button>
      <button class="tom-command-button" data-tom-action="set-active-wall" data-wall="2">W2</button>
      <button class="tom-command-button" data-tom-action="set-active-wall" data-wall="3">W3</button>
      <button class="tom-command-button tom-command-primary" data-tom-action="send">Send</button>
      <button class="tom-command-button tom-command-danger" data-tom-action="stop-all">End all</button>
    `;
    document.body.appendChild(commandBar);

    const rail = document.createElement("aside");
    rail.id = "top-of-mind-rail";
    rail.innerHTML = `
      <div class="tom-header">
        <div>
          <div class="tom-title">Top of Mind Inbox</div>
          <div class="tom-subtitle" data-tom-status>Live room: collecting level 3+</div>
        </div>
        <button class="tom-button" data-tom-action="clear">Clear</button>
      </div>
      <div class="tom-room-controls">
        <button class="tom-button tom-button-primary" data-tom-action="toggle-live">Live</button>
        <button class="tom-button" data-tom-action="stop-all">Stop all</button>
        <select class="tom-select" data-tom-floor>
          <option value="1">Auto level 1+</option>
          <option value="2">Auto level 2+</option>
          <option value="3" selected>Auto level 3+</option>
          <option value="4">Auto level 4+</option>
          <option value="5">Auto level 5 only</option>
        </select>
      </div>
      <div class="tom-wall-tabs">
        <button class="tom-wall-tab" data-tom-action="set-active-wall" data-wall="all">All</button>
        <button class="tom-wall-tab" data-tom-action="set-active-wall" data-wall="1">Wall 1</button>
        <button class="tom-wall-tab" data-tom-action="set-active-wall" data-wall="2">Wall 2</button>
        <button class="tom-wall-tab" data-tom-action="set-active-wall" data-wall="3">Wall 3</button>
      </div>
      <div class="tom-source-grid" data-tom-sources></div>
      <div class="tom-composer">
        <div class="tom-composer-row">
          <select class="tom-select" data-tom-source>
            ${sources.map((source) => `<option>${source}</option>`).join("")}
          </select>
          <select class="tom-select" data-tom-level>
            <option value="5">Level 5 urgent</option>
            <option value="4">Level 4 strong</option>
            <option value="3" selected>Level 3 normal</option>
            <option value="2">Level 2 side</option>
            <option value="1">Level 1 log</option>
          </select>
        </div>
        <textarea class="tom-textarea" data-tom-text placeholder="Paste or capture an AI message here"></textarea>
        <div class="tom-actions">
          <button class="tom-button tom-button-primary" data-tom-action="add">Add</button>
          <button class="tom-button" data-tom-action="clip">Clipboard</button>
          <button class="tom-button" data-tom-action="combine">Combine</button>
        </div>
      </div>
      <div class="tom-list" data-tom-list></div>
      <div class="tom-footer">
        <button class="tom-button tom-button-primary" data-tom-action="send">Send to input</button>
        <button class="tom-button" data-tom-action="copy">Copy combined</button>
        <button class="tom-button" data-tom-action="unpick">Unpick all</button>
      </div>
    `;
    document.body.appendChild(rail);
    rail.addEventListener("click", handleRailClick);
    rail.addEventListener("change", handleRailChange);
    dock.addEventListener("click", handleRailClick);
    commandBar.addEventListener("click", handleRailClick);
    commandBar.addEventListener("change", handleRailChange);
    renderRail();
  }

  async function handleRailClick(event) {
    const action = event.target.closest("[data-tom-action]")?.getAttribute("data-tom-action");
    const cardId = event.target.closest("[data-tom-id]")?.getAttribute("data-tom-id");
    if (!action) return;
    const rail = document.getElementById("top-of-mind-rail");
    const textBox = rail.querySelector("[data-tom-text]");
    const source = rail.querySelector("[data-tom-source]").value;
    const level = Number(rail.querySelector("[data-tom-level]").value);
    const priority = priorityFromLevel(level);

    if (action === "open-rail") {
      document.body.classList.remove("tom-rail-closed");
      document.body.classList.add("tom-rail-open");
      renderRail();
      return;
    }

    if (action === "source-focus") {
      const sourceName = event.target.closest("[data-source-name]")?.getAttribute("data-source-name");
      if (sourceName) {
        rail.querySelector("[data-tom-source]").value = sourceName;
        document.body.classList.remove("tom-rail-closed");
        document.body.classList.add("tom-rail-open");
        rail.querySelector("[data-tom-text]").focus();
        renderRail();
      }
      return;
    }

    if (action === "add") {
      addItem(textBox.value, source, priority, level);
      textBox.value = "";
    }

    if (action === "clip") {
      try {
        const clip = await navigator.clipboard.readText();
        addItem(clip, source === "Clipboard" ? "Clipboard" : source, priority, level);
      } catch {
        textBox.placeholder = "Clipboard permission was blocked. Paste manually here.";
      }
    }

    if (action === "toggle" && cardId) {
      const items = readItems().map((item) =>
        item.id === cardId ? { ...item, selected: !item.selected } : item
      );
      writeItems(items);
      renderRail();
    }

    if (action === "set-wall" && cardId) {
      const wall = Number(event.target.closest("[data-wall]")?.getAttribute("data-wall") || 1);
      writeItems(readItems().map((item) => (item.id === cardId ? { ...item, wall } : item)));
      renderRail();
    }

    if (action === "delete" && cardId) {
      writeItems(readItems().filter((item) => item.id !== cardId));
      renderRail();
    }

    if (action === "split" && cardId) {
      const items = readItems();
      const item = items.find((candidate) => candidate.id === cardId);
      if (item) {
        const parts = item.text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z0-9])/).map((part) => part.trim()).filter(Boolean);
        const replacement = parts.map((part) => ({
          ...item,
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          text: part
        }));
        writeItems(items.flatMap((candidate) => (candidate.id === cardId ? replacement : [candidate])));
        renderRail();
      }
    }

    if (action === "combine") {
      textBox.value = selectedText();
      textBox.focus();
    }

    if (action === "split-three") {
      const selected = getSelectedItems();
      if (selected.length) {
        const selectedIds = new Set(selected.map((item) => item.id));
        let index = 0;
        writeItems(readItems().map((item) => {
          if (!selectedIds.has(item.id)) return item;
          const wall = (index % 3) + 1;
          index += 1;
          return { ...item, wall };
        }));
        renderRail();
      }
    }

    if (action === "copy") {
      await navigator.clipboard.writeText(selectedText());
    }

    if (action === "send") {
      insertIntoChatInput(selectedText());
    }

    if (action === "clear") {
      writeItems(readItems().filter((item) => !item.selected));
      renderRail();
    }

    if (action === "unpick") {
      writeItems(readItems().map((item) => ({ ...item, selected: false })));
      renderRail();
    }

    if (action === "toggle-live") {
      const settings = readSettings();
      settings.paused = !settings.paused;
      writeSettings(settings);
      renderRail();
    }

    if (action === "stop-all") {
      const settings = readSettings();
      settings.paused = true;
      settings.muted = Object.fromEntries(sources.map((sourceName) => [sourceName, true]));
      writeSettings(settings);
      renderRail();
    }

    if (action === "toggle-source") {
      const sourceName = event.target.closest("[data-source-name]")?.getAttribute("data-source-name");
      if (sourceName) {
        const settings = readSettings();
        settings.muted[sourceName] = !settings.muted[sourceName];
        writeSettings(settings);
        renderRail();
      }
    }

    if (action === "set-active-wall") {
      const wall = event.target.closest("[data-wall]")?.getAttribute("data-wall") || "all";
      const settings = readSettings();
      settings.activeWall = wall;
      writeSettings(settings);
      renderRail();
    }
  }

  function handleRailChange(event) {
    const floor = event.target.closest("[data-tom-floor]");
    if (floor) {
      const settings = readSettings();
      settings.levelFloor = Number(floor.value);
      writeSettings(settings);
      writeItems(readItems().map((item) => ({ ...item, selected: Number(item.level || 3) >= settings.levelFloor })));
      renderRail();
    }

    const folder = event.target.closest("[data-tom-folder]");
    if (folder) {
      const settings = readSettings();
      settings.activeFolder = folder.value;
      writeSettings(settings);
      renderRail();
    }
  }

  function renderRail() {
    const list = document.querySelector("[data-tom-list]");
    if (!list) return;
    const settings = readSettings();
    const status = document.querySelector("[data-tom-status]");
    const floor = document.querySelector("[data-tom-floor]");
    const sourceGrid = document.querySelector("[data-tom-sources]");
    const folderSelect = document.querySelector("[data-tom-folder]");
    if (status) {
      const mutedCount = Object.values(settings.muted || {}).filter(Boolean).length;
      status.textContent = `${settings.paused ? "Paused" : "Live"} room: auto-picking level ${settings.levelFloor}+${mutedCount ? `, ${mutedCount} muted` : ""}`;
    }
    if (floor) floor.value = String(settings.levelFloor);
    if (folderSelect) folderSelect.value = settings.activeFolder || "Main";
    const liveButton = document.querySelector('[data-tom-action="toggle-live"]');
    if (liveButton) {
      liveButton.textContent = settings.paused ? "Resume" : "Live";
      liveButton.classList.toggle("tom-button-primary", !settings.paused);
      liveButton.classList.toggle("tom-button-danger", settings.paused);
    }
    if (sourceGrid) {
      sourceGrid.innerHTML = sources.map((sourceName) => {
        const muted = !!settings.muted[sourceName];
        return `<button class="tom-source-toggle" data-tom-action="toggle-source" data-source-name="${escapeHtml(sourceName)}" aria-pressed="${!muted}">${escapeHtml(sourceName)}${muted ? " off" : ""}</button>`;
      }).join("");
    }
    document.querySelectorAll("[data-tom-action='set-active-wall']").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.getAttribute("data-wall") === String(settings.activeWall)));
    });
    document.querySelectorAll(".tom-dock-source").forEach((button) => {
      const sourceName = button.getAttribute("data-source-name");
      button.setAttribute("aria-pressed", String(!settings.muted[sourceName]));
    });
    const items = readItems();
    const visibleItems = items.filter((item) =>
      settings.activeSources[item.source] !== false &&
      (settings.activeFolder === "Main" || !item.folder || item.folder === settings.activeFolder) &&
      (settings.activeWall === "all" || String(item.wall || 1) === String(settings.activeWall))
    );
    if (!visibleItems.length) {
      list.innerHTML = `<div class="tom-card"><div class="tom-card-text">No messages yet. Paste a Kimi/GPT/Codex reply above or capture the clipboard.</div></div>`;
      return;
    }
    list.innerHTML = visibleItems.map((item) => `
      <article class="tom-card" data-priority="${escapeHtml(item.priority)}" data-tom-id="${escapeHtml(item.id)}">
        <div class="tom-card-top">
          <div class="tom-card-meta">
            <span class="tom-source">${escapeHtml(item.source)}</span>
            <span>${escapeHtml(item.folder || "Main")}</span>
            <span>W${escapeHtml(item.wall || 1)}</span>
            <span>L${escapeHtml(item.level || 3)}</span>
            <span>${escapeHtml(item.priority)}</span>
          </div>
          <button class="tom-mini-button" aria-pressed="${item.selected ? "true" : "false"}" data-tom-action="toggle">${item.selected ? "Picked" : "Pick"}</button>
        </div>
        <div class="tom-card-text">${escapeHtml(item.text)}</div>
        <div class="tom-card-controls">
          <button class="tom-mini-button" data-tom-action="set-wall" data-wall="1">W1</button>
          <button class="tom-mini-button" data-tom-action="set-wall" data-wall="2">W2</button>
          <button class="tom-mini-button" data-tom-action="set-wall" data-wall="3">W3</button>
          <button class="tom-mini-button" data-tom-action="split">Split</button>
          <button class="tom-mini-button" data-tom-action="delete">Delete</button>
        </div>
      </article>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  applyLocalCustomizations();
  clearStaticAppCache().catch(() => {});
  window.addEventListener("load", applyLocalCustomizations);
  setInterval(applyLocalCustomizations, 1500);

  new MutationObserver(applyLocalCustomizations).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
