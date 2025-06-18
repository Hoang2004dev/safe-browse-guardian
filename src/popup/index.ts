//=================================== index.ts
import { getDB, setDB } from './storage';
import { normalizeDomain } from './normalize';
import { syncDynamicRulesFromLocalDB } from './rules';
import { render, renderWarnings } from './ui';

document.addEventListener('DOMContentLoaded', () => {
  render();
  renderWarnings();

  document.getElementById("clearLogs")?.addEventListener("click", async () => {
    const db = await getDB();
    db.warningLogs = [];
    await setDB(db);
    renderWarnings();
  });

  document.getElementById("addBlack")?.addEventListener("click", async () => {
    const input = <HTMLInputElement>document.getElementById("blackInput");
    const domain = await normalizeDomain(input.value.trim());
    if (!domain) return;
    const db = await getDB();
    if (!db.blacklist.includes(domain)) {
      db.blacklist.push(domain);
      await setDB(db);
      await syncDynamicRulesFromLocalDB();
      input.value = "";
      render();
    }
  });

  document.getElementById("refresh")?.addEventListener("click", render);

  document.getElementById("toggleSandbox")?.addEventListener("change", async (e) => {
    const db = await getDB();
    db.sandboxEnabled = (e.target as HTMLInputElement).checked;
    await setDB(db);
  });

  document.getElementById("export")?.addEventListener("click", async () => {
    const db = await getDB();
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SafeBrowseLocalDB.json";
    a.click();
  });

  document.getElementById("importJson")?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      if (json.blacklist) {
        await setDB(json);
        await syncDynamicRulesFromLocalDB();
        render();
      } else alert("Tệp không hợp lệ.");
    } catch {
      alert("Không thể đọc tệp JSON.");
    }
  });
});
