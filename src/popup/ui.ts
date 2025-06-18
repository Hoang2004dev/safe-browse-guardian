//=================================== ui.ts
import { getDB, setDB } from './storage';

export async function render() {
  const db = await getDB();
  (document.getElementById("dbOutput") as HTMLTextAreaElement).value = JSON.stringify(db, null, 2);

  const renderList = (id: string, items: string[], removeHandler: (item: string) => void) => {
    const ul = document.getElementById(id)!;
    ul.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item + " ";
      const del = document.createElement("button");
      del.textContent = "✖";
      del.className = "danger";
      del.onclick = () => removeHandler(item);
      li.appendChild(del);
      ul.appendChild(li);
    });
  };

  renderList("blacklist", db.blacklist, async (item) => {
    db.blacklist = db.blacklist.filter((i: string) => i !== item);
    await setDB(db);
    render();
  });

  (document.getElementById("toggleSandbox") as HTMLInputElement).checked = !!db.sandboxEnabled;
}

export async function renderWarnings() {
  const db = await getDB();
  const list = document.getElementById("warningList")!;
  const links: string[] = db.warningLogs || [];
  list.innerHTML =
    links.length === 0
      ? "<li><em>Không có link nguy hiểm nào.</em></li>"
      : links
          .map((link) => `<li><a href="${link}" target="_blank">${link}</a></li>`)
          .join("");
}
