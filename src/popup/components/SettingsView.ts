// popup/components/SettingsView.ts
import { getDB, setDB } from "../storage";
import { syncDynamicRulesFromLocalDB } from "../rules";

export async function renderSettingsSection(root: HTMLElement) {
  const db = await getDB();

  const section = document.createElement("section");
  section.innerHTML = `
    <h2>⚙️ Cài đặt</h2>

    <div class="setting-row">
      <span>Bật tiện ích</span>
      <label class="toggle-switch">
        <input type="checkbox" id="toggleExtension" ${
          db.extensionEnabled !== false ? "checked" : ""
        }>
        <span class="slider"></span>
      </label>
    </div>

    <div class="setting-row">
      <span>Bật phân tích sandbox</span>
      <label class="toggle-switch">
        <input type="checkbox" id="toggleSandbox" ${
          db.sandboxEnabled ? "checked" : ""
        }>
        <span class="slider"></span>
      </label>
    </div>

    <h2>📂 Dữ liệu</h2>
    <div style="margin-top: 10px;">
      <button id="exportDB">⇡ Xuất JSON</button>
      <input type="file" id="importDB" accept=".json" />
    </div>
    <textarea id="dbOutput" readonly style="width:100%; margin-top:10px; height:100px;"></textarea>
  `;

  root.appendChild(section);

  const sandboxToggle = document.getElementById(
    "toggleSandbox"
  ) as HTMLInputElement;
  const extensionToggle = document.getElementById(
    "toggleExtension"
  ) as HTMLInputElement;
  const output = document.getElementById("dbOutput") as HTMLTextAreaElement;
  output.value = JSON.stringify(db, null, 2);

  sandboxToggle.addEventListener("change", async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    db.sandboxEnabled = enabled;
    await setDB(db);
    await syncDynamicRulesFromLocalDB();
  });

  extensionToggle.addEventListener("change", async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    db.extensionEnabled = enabled;
    await setDB(db);
    chrome.runtime.sendMessage({ type: "TOGGLE_EXTENSION", enabled });
  });

  document.getElementById("exportDB")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SafeBrowseLocalDB.json";
    a.click();
  });

  document.getElementById("importDB")?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.blacklist)) {
        await setDB(json);
        await syncDynamicRulesFromLocalDB();
        output.value = JSON.stringify(json, null, 2);
      } else {
        alert("Tệp JSON không hợp lệ.");
      }
    } catch {
      alert("Không thể đọc tệp JSON.");
    }
  });
}
