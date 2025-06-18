//=================================== popup.ts
export function showWarningPopup(
  msg: string,
  url: string,
  onContinue: () => void,
  onBlock: () => void
): void {
  if (document.querySelector(".safebrowse-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "safebrowse-overlay";
  overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 9999; display: flex;
    justify-content: center; align-items: center;`;

  const popup = document.createElement("div");
  popup.style.cssText = `
    background: white; padding: 20px; border-radius: 8px;
    max-width: 400px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;

  const createEl = (tag: string, text: string, css: string) => {
    const el = document.createElement(tag);
    el.style.cssText = css;
    el.textContent = text;
    return el;
  };

  popup.appendChild(createEl("p", msg.split("<br>")[0], "margin: 0 0 15px; color: #d32f2f;"));
  const detail = msg.split("<br>")[1]?.replace(/<\/?small>/g, "");
  if (detail) popup.appendChild(createEl("p", detail, "margin: 0 0 15px; color: #666; font-size: 0.9em;"));
  popup.appendChild(createEl("p", url, "margin: 0 0 15px; word-break: break-all;"));

  const actions = [
    { id: "continueBtn", text: "Tiếp tục", color: "#4CAF50", cb: onContinue },
    { id: "blockBtn", text: "Thêm vào Blacklist", color: "#f44336", cb: onBlock },
    { id: "cancelBtn", text: "Hủy", color: "#9e9e9e", cb: () => overlay.remove() },
  ];

  for (const { id, text, color, cb } of actions) {
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = text;
    btn.style.cssText = `padding: 8px 16px; margin: 5px; background: ${color}; color: white;
      border: none; border-radius: 4px; cursor: pointer;`;
    btn.onclick = () => {
      overlay.remove();
      cb();
    };
    popup.appendChild(btn);
  }

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
