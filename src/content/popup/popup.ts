import { injectPopupStyles } from "./popupStyle";

export function showWarningPopup(
  msg: string,
  url: string,
  onContinue: () => void,
  onBlock: () => void,
  level: "critical" | "warning" | "info" = "info"
): void {

  // Inject the popup styles
  injectPopupStyles();

  // Check if the overlay already exists
  if (document.querySelector(".safebrowse-overlay")) return;

  // Create overlay element
  const overlay = document.createElement("div");
  overlay.className = "safebrowse-overlay";

  // Create popup container
  const popup = document.createElement("div");
  popup.className = "safebrowse-popup"; // Apply the popup class

  const icon = document.createElement("div");
  icon.className = "scan-popup-icon";
  icon.innerHTML = {
    critical: "&#9888;",   // ⚠
    warning: "&#128712;",  // 🛈
    info: "&#8505;"        // ℹ
  }[level];
  popup.appendChild(icon);

  // Create header/title for the popup
  const header = document.createElement("h2");
  header.textContent = "Phát hiện URL lừa đảo"; // Title
  header.className = "popup-header"; // Apply a class for styling
  popup.appendChild(header);

  const detailEl = document.createElement("details");
  detailEl.className = "popup-details";
  const summary = document.createElement("summary");
  summary.textContent = "Chi tiết cảnh báo";
  const inner = document.createElement("div");
  inner.textContent = msg;
  detailEl.appendChild(summary);
  detailEl.appendChild(inner);
  popup.appendChild(detailEl);

  const actions = [
    { id: "continueBtn", text: "Tiếp tục", icon: "fas fa-check", className: "btn-continue", cb: onContinue },
    { id: "blockBtn", text: "Thêm vào Blacklist", icon: "fas fa-ban", className: "btn-block", cb: onBlock },
  ];

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container"; // Add button container class

  actions.forEach(({ id, text, icon, className, cb }) => {
    const btn = document.createElement("button");
    btn.id = id;
    btn.className = className;

    // Add icon to button
    const iconElement = document.createElement("i");
    iconElement.className = icon;

    // Create text node for button
    const textNode = document.createTextNode(` ${text}`);

    btn.appendChild(iconElement);
    btn.appendChild(textNode);

    btn.addEventListener("click", () => {
      overlay.remove();
      cb();
    });

    buttonContainer.appendChild(btn);
  });

  popup.appendChild(buttonContainer);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// Helper function to create elements with content and class
function createEl(tag: string, text: string, className: string) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}