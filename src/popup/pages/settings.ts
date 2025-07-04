// popup/pages/settings.ts
import { renderHeader, renderFooter } from "../components/Layout";
import { renderNav } from "../components/Navigation";
import { renderSettingsSection } from "../components/SettingsView";

export async function renderSettings() {
  const root = document.body;
  root.innerHTML = "";

  renderHeader(root);
  renderNav(root);
  await renderSettingsSection(root);

  // Dark Mode Section
  const section = document.createElement("section");
  section.innerHTML = `
    <h2>🎨 Giao diện</h2>
    <div class="setting-row">
      <span>Bật chế độ nền tối</span>
      <label class="toggle-switch">
        <input type="checkbox" id="darkModeToggle">
        <span class="slider"></span>
      </label>
    </div>
  `;
  root.appendChild(section);

  const stored = await chrome.storage.local.get("darkMode");
  const enabled = stored.darkMode === true;
  document.body.classList.toggle("dark", enabled);
  (document.getElementById("darkModeToggle") as HTMLInputElement).checked =
    enabled;

  document
    .getElementById("darkModeToggle")
    ?.addEventListener("change", async (e) => {
      const on = (e.target as HTMLInputElement).checked;
      document.body.classList.toggle("dark", on);
      await chrome.storage.local.set({ darkMode: on });
    });

  renderFooter(root);
}
