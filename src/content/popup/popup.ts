import { getOverlayStyle, getPopupStyle, getLevelStyle, getButtonStyle, getDetailsStyle } from "./popupStyle";

export function showWarningPopup(
  msg: string,
  url: string,
  onContinue: () => void,
  onBlock: () => void,
  level: "critical" | "warning" | "info" = "info"
): void {
  if (document.querySelector(".safebrowse-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "safebrowse-overlay";
  overlay.style.cssText = getOverlayStyle();

  const popup = document.createElement("div");
  popup.style.cssText = getPopupStyle();

  const createEl = (tag: string, text: string, css: string) => {
    const el = document.createElement(tag);
    el.style.cssText = css;
    el.textContent = text;
    return el;
  };

  const firstLine = msg.split("<br>")[0];
  popup.appendChild(createEl("p", firstLine, getLevelStyle(level)));

  const detail = msg.split("<br>").slice(1).join("<br>");
  if (detail) {
    const detailEl = document.createElement("details");
    detailEl.style.cssText = getDetailsStyle();
    const summary = document.createElement("summary");
    summary.textContent = "Chi tiết cảnh báo";
    const inner = document.createElement("div");
    inner.innerHTML = detail;
    detailEl.appendChild(summary);
    detailEl.appendChild(inner);
    popup.appendChild(detailEl);
  }

  popup.appendChild(createEl("p", url, "margin: 0 0 15px; word-break: break-word; font-size: 0.85em;"));

  const actions = [
    { id: "continueBtn", text: "Tiếp tục", color: "#4CAF50", cb: onContinue },
    { id: "blockBtn", text: "Thêm vào Blacklist", color: "#f44336", cb: onBlock },
    { id: "cancelBtn", text: "Hủy", color: "#9e9e9e", cb: () => overlay.remove() },
  ];

  for (const { id, text, color, cb } of actions) {
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = text;
    btn.style.cssText = getButtonStyle(color);
    btn.onclick = () => {
      overlay.remove();
      cb();
    };
    popup.appendChild(btn);
  }

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
