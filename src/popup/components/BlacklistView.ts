// popup/components/BlacklistView.ts
import { getDB, setDB } from "../storage";
import { normalizeDomain } from "../../shared/utils/normalize";
import { syncDynamicRulesFromLocalDB } from "../rules";

export async function renderBlacklistSection(root: HTMLElement) {
  const section = document.createElement("section");
  section.innerHTML = `
    <h2>Quản lý Blacklist</h2>
    <div style="display:flex; gap:6px;">
      <input type="text" id="blackInput" placeholder="Thêm domain..." style="flex:1;" />
      <button id="addBlack">✚</button>
    </div>
    <ul id="blacklistList" style="margin-top:10px;"></ul>
  `;

  root.appendChild(section);
  await renderList();

  document.getElementById("addBlack")?.addEventListener("click", async () => {
    const input = document.getElementById("blackInput") as HTMLInputElement;
    const domain = await normalizeDomain(input.value.trim());
    if (!domain) return;

    const db = await getDB();
    if (!db.blacklist.includes(domain)) {
      db.blacklist.push(domain);
      await setDB(db);
      await syncDynamicRulesFromLocalDB();
      input.value = "";
      await renderList();
    }
  });
}

async function renderList() {
  const db = await getDB();
  const list = document.getElementById("blacklistList")!;
  list.innerHTML = "";

  db.blacklist.forEach((domain: string) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.marginBottom = "6px";

    const span = document.createElement("span");
    span.textContent = domain;

    const btn = document.createElement("button");
    btn.textContent = "✖";
    btn.className = "danger";
    btn.onclick = async () => {
      db.blacklist = db.blacklist.filter((d: string) => d !== domain);
      await setDB(db);
      await syncDynamicRulesFromLocalDB();
      await renderList();
    };

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}
