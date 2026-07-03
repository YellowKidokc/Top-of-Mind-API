# Gemini FIS GUI - Development Documentation

This folder contains a premium, responsive, and highly interactive graphical user interface (GUI) designed and built by **Gemini** to act as the operator's workspace for the **File Intelligence System (FIS)**.

## Project Structure

All files inside this directory have been custom-implemented and annotated with the **Gemini Developer Signature**:

- `index.html`: The main single-page layout utilizing semantic HTML5 elements, responsive scaling layouts, and clean DOM anchors.
- `css/gemini-styles.css`: The styling system containing custom CSS variables, class bindings for glassmorphism panels, glowing indicator states (red/green/gold), custom scrollbars, and hover keyframes.
- `js/gemini-mock-data.js`: A rich dataset mapping the 20 onboarding questions (from preference schema specs), mock files, prediction objects, folder stats, automation rules, and review queue items.
- `js/gemini-app.js`: State manager, view switcher, event binders, dynamic builders, toast dispatcher, connection modals, and native `fetch` connection probes.

---

## How to Launch the GUI

### Option A: Direct Browser Launch (Simulated Mode)
Since the app uses vanilla HTML5, CSS, and JS (zero build steps, zero node_modules required), you can open it directly in any modern web browser:
1. Double-click or open `index.html` in your browser.
2. The connection status indicator on the sidebar will detect that no local FastAPI instance is running, and will automatically toggle to **Simulated Mode**.
3. All views (Predictions, Rename Studio, Folder Builder, Auto Rules, Review Gates) are fully interactive in this mode.

### Option B: Local Development server (Live Mode)
If you have node/npm installed on your machine and want to run it via dev server:
1. Install a lightweight server globally: `npm install -g http-server`
2. Run `http-server` from inside this directory.
3. Open `http://localhost:8080`.
4. Ensure the FastAPI backend is running (`apps/api` folder instructions) on port `10000`.
5. Click **Connect API** in the GUI sidebar to configure local/LAN synchronization.
