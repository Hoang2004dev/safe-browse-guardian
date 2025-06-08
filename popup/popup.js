document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("warningList");
  const clearBtn = document.getElementById("clearLogs");

  // 🚨 Hiển thị danh sách link bị cảnh báo
  chrome.storage.local.get(["localDB"], (data) => {
    const links = data.localDB?.warningLogs || [];
    list.innerHTML =
      links.length === 0
        ? "<li><em>Không có link nguy hiểm nào.</em></li>"
        : links
            .map(
              (link) => `<li><a href="${link}" target="_blank">${link}</a></li>`
            )
            .join("");
  });

  // 🧹 Xoá toàn bộ log cảnh báo
  clearBtn.addEventListener("click", async () => {
    const db = await getDB();
    db.warningLogs = [];
    await setDB(db);
    list.innerHTML = "<li><em>Đã xoá toàn bộ link bị cảnh báo.</em></li>";
  });

  // async function getDB() {
  //   return new Promise((resolve) => {
  //     chrome.storage.local.get("localDB", (data) => {
  //       resolve(data.localDB || { blacklist: [], warningLogs: [] });
  //     });
  //   });
  // }
  async function getDB() {
    return new Promise((resolve) => {
      chrome.storage.local.get("localDB", (data) => {
        resolve(
          data.localDB || {
            blacklist: [],
            warningLogs: [],
            sandboxEnabled: true,
          }
        );
      });
    });
  }

  async function setDB(db) {
    await chrome.storage.local.set({ localDB: db });
    render();
  }

  async function normalizeDomain(domain) {
    try {
      const hostname = new URL(
        domain.startsWith("http") ? domain : `https://${domain}`
      ).hostname;
      return hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return domain.toLowerCase();
    }
  }

  async function syncDynamicRulesFromLocalDB() {
    const db = await getDB();
    const blacklist = db.blacklist.map((d) => d.toLowerCase());
    const allRuleIds = Array.from({ length: 100 }, (_, i) => i + 1);

    if (blacklist.length === 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: allRuleIds,
      });
      console.log("🗑️ All DNR rules cleared (blacklist is empty)");
      return;
    }

    const rules = blacklist.map((domain, idx) => ({
      id: idx + 1,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: [
          "main_frame",
          "script",
          "sub_frame",
          "image",
          "xmlhttprequest",
        ],
      },
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: allRuleIds,
      addRules: rules,
    });
    console.log("📦 DNR rules synced with blacklist");
  }

  async function render() {
    const db = await getDB();
    document.getElementById("dbOutput").value = JSON.stringify(db, null, 2);

    const renderList = (id, items, removeHandler) => {
      const ul = document.getElementById(id);
      ul.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item + " ";
        const del = document.createElement("button");
        del.textContent = "✖";
        del.onclick = () => removeHandler(item);
        li.appendChild(del);
        ul.appendChild(li);
      });
    };

    renderList("blacklist", db.blacklist, async (item) => {
      db.blacklist = db.blacklist.filter((i) => i !== item);
      await setDB(db);
      await syncDynamicRulesFromLocalDB();
    });

    document.getElementById("toggleSandbox").checked = !!db.sandboxEnabled;
  }

  document.getElementById("addBlack").onclick = async () => {
    const input = document.getElementById("blackInput");
    const raw = input.value.trim();
    if (!raw) return;

    const domain = await normalizeDomain(raw);
    const db = await getDB();

    if (!db.blacklist.includes(domain)) {
      db.blacklist.push(domain);
      await setDB(db);
      await syncDynamicRulesFromLocalDB();
      input.value = "";
    }
  };

  document.getElementById("refresh").onclick = render;
  document
    .getElementById("toggleSandbox")
    .addEventListener("change", async (e) => {
      const enabled = e.target.checked;
      const db = await getDB();
      db.sandboxEnabled = enabled;
      await setDB(db);
    });

  document.getElementById("export").onclick = async () => {
    const db = await getDB();
    const blob = new Blob([JSON.stringify(db, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SafeBrowseLocalDB.json";
    a.click();
  };

  document
    .getElementById("importJson")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          if (json.blacklist) {
            await setDB(json);
            await syncDynamicRulesFromLocalDB();
          } else {
            alert("Tệp không hợp lệ.");
          }
        } catch {
          alert("Không thể đọc tệp JSON.");
        }
      }
    });

  render();
});
