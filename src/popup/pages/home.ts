// popup/pages/home.ts
import { getDB } from "../storage";
import { setPaused } from "../../content/core/pausedState";

export class HomePage {
  private root: HTMLElement;
  private isEnabled: boolean = true;
  private blocked: number = 0;
  private checked: number = 0;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  async init(forceState?: boolean) {
    const db = await getDB();
    this.isEnabled =
    forceState !== undefined ? forceState : (db.extensionEnabled ?? false);
    this.blocked = db.blacklist?.length || 0;
    this.render();
    this.bindEvents();
    this.checked = db.checkedCount || 0;
  }

  private render() {
    this.root.innerHTML = "";
    this.root.className = "dark";

    // === HEADER ===
    const header = document.createElement("header");
    header.style.textAlign = "center";

    const pauseBtnTitle = this.isEnabled ? "Pause" : "Resume";
    const pauseBtnIcon = this.isEnabled ? "pause.png" : "play.png";

    header.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px;">
        <img src="../assets/logo.png" alt="logo" width="52" height="42">
        <span style="font-weight:600;">SafeBrowse</span>
        
        <button id="refreshBtn" title="Refresh" class="icon-btn">
          <img src="../assets/reload.png" alt="refresh" width="22" height="22">
        </button>

        <button id="pauseBtn" title="${pauseBtnTitle}" class="icon-btn">
          <img id="pauseIcon" src="../assets/${pauseBtnIcon}" width="22" height="22">
        </button>

        <button id="settingsBtn" title="Settings" class="icon-btn">
          <img src="../assets/setting.png" alt="settings" width="22" height="22">
        </button>
      </div>
    `;
    this.root.appendChild(header);

    // === COUNTER ===
    const counter = document.createElement("div");
    counter.style.textAlign = "center";
    counter.style.margin = "20px 0";
    counter.innerHTML = `
      <p id="checkedCount" style="font-weight:700;font-size:16px;margin-bottom:10px;">
        Checked: ${this.checked}
      </p>
      <label class="toggle-switch">
        <input id="enableToggle" type="checkbox" ${this.isEnabled ? "checked" : ""}>
        <span class="slider"></span>
      </label>
    `;
    this.root.appendChild(counter);

    // === ACTION & STATISTICS ===
    const tabs = document.createElement("div");
    tabs.style.display = "flex";
    tabs.style.justifyContent = "center";
    tabs.style.marginBottom = "20px";
    tabs.innerHTML = `
      <div style="display:flex;background:#444;padding:2px;border-radius:8px;">
        <button style="flex:1;padding:6px 16px;background:#222;color:#fff;border-radius:6px 0 0 6px;">Action</button>
        <button style="flex:1;padding:6px 16px;background:#444;color:#fff;border-radius:0 6px 6px 0;">Statistics</button>
      </div>
    `;
    this.root.appendChild(tabs);

    // === MENU ITEMS ===
    const menu = document.createElement("div");
    menu.style.display = "flex";
    menu.style.flexDirection = "column";
    menu.style.gap = "16px";
    menu.style.fontSize = "14px";
    menu.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;cursor:pointer;">
        <span style="font-size:16px;">
          <img src="../assets/speaker.png" alt="report" width="22" height="22">
        </span>
        <span>Báo cáo sự cố</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;cursor:pointer;">
        <span style="font-size:16px;">
          <img src="../assets/information.png" alt="info" width="22" height="22">
        </span>
        <span>Thông tin trang web</span>
      </div>
    `;
    this.root.appendChild(menu);

    // === FOOTER ===
    const footer = document.createElement("footer");
    footer.style.textAlign = "center";
    footer.style.marginTop = "30px";
    footer.style.fontSize = "12px";
    footer.style.color = "#aaa";
    footer.style.padding = "8px";
    footer.style.background = "#222";
    footer.innerHTML = `© 2024–2025 SafeBrowse Software Ltd`;
    this.root.appendChild(footer);
  }

  private bindEvents() {
    document
      .getElementById("refreshBtn")
      ?.addEventListener("click", () => this.handleRefresh());
    document
      .getElementById("pauseBtn")
      ?.addEventListener("click", () => this.handleTogglePause());
    document
      .getElementById("settingsBtn")
      ?.addEventListener("click", () => this.handleSettings());
    document
      .getElementById("enableToggle")
      ?.addEventListener("change", () => this.handleTogglePause());
  }

  // === HANDLERS ===
  private handleRefresh() {
    chrome.runtime.sendMessage({ type: "REFRESH_DB" }, async (res) => {
      console.log("[popup] Refresh:", res);
      const db = await getDB();
      this.blocked = db.blacklist?.length || 0;
      this.checked = db.checkedCount || 0;
      this.updateBlockedCounter();
      this.updateCheckedCounter();
    });
  }

  private handleTogglePause() {
    chrome.runtime.sendMessage({ type: "TOGGLE_PAUSE" }, async (res) => {
      console.log("[popup] Toggled:", res);
      this.isEnabled = res.extensionEnabled;
      await setPaused(!this.isEnabled);
      this.updatePauseUI();
    });
  }

  private handleSettings() {
    chrome.tabs.create({ url: "https://www.google.com" });
  }

  // === UI UPDATERS ===
  private updateBlockedCounter() {
    const counter = document.getElementById("blockedCount");
    if (counter) counter.textContent = `Blocked: ${this.blocked}`;
  }

  private updateCheckedCounter() {
  const counter = document.getElementById("checkedCount");
  if (counter) counter.textContent = `Checked: ${this.checked}`;
}


  private updatePauseUI() {
    const pauseBtn = document.getElementById("pauseBtn");
    const icon = document.getElementById("pauseIcon") as HTMLImageElement;
    const toggle = document.getElementById("enableToggle") as HTMLInputElement;

    if (pauseBtn && icon) {
      icon.src = `../assets/${this.isEnabled ? "pause.png" : "play.png"}`;
      pauseBtn.title = this.isEnabled ? "Pause" : "Resume";
    }
    if (toggle) {
      toggle.checked = this.isEnabled;
    }
  }
}

// === Entry point ===
export function renderHome(forceState?: boolean) {
  const page = new HomePage(document.body);
  page.init(forceState);
}
