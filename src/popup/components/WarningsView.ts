// popup/components/WarningsView.ts
import { getDB, setDB } from "../storage";

export async function renderWarningsSection(root: HTMLElement) {
  const section = document.createElement("section");
  section.innerHTML = `
    <h2>Cảnh báo link nguy hiểm</h2>
    <ul id="warningList" style="margin-top:10px;"></ul>
    <button id="clearWarnings" class="danger" style="margin-top:10px;">🗑️ Xoá toàn bộ</button>
  `;

  root.appendChild(section);
  await renderList();

  document.getElementById("clearWarnings")?.addEventListener("click", async () => {
    const db = await getDB();
    db.warningLogs = [];
    await setDB(db);
    await renderList();
  });
}

async function renderList() {
  const db = await getDB();
  const list = document.getElementById("warningList")!;
  const links: string[] = db.warningLogs || [];

  if (links.length === 0) {
    list.innerHTML = "<li><em>Không có link nguy hiểm nào.</em></li>";
    return;
  }

  list.innerHTML = "";
  links.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link;
    a.textContent = link;
    a.target = "_blank";
    a.style.wordBreak = "break-all";
    li.appendChild(a);
    list.appendChild(li);
  });
}
