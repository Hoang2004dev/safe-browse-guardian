import { injectScanPopupStyles } from "./popupStyle";

export function showScanResultPopup(
  title: string,
  description: string,
  patternType: string,
  onClose: () => void,
): void {

  injectScanPopupStyles();

  if (document.querySelector(".scan-popup-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "scan-popup-overlay";

  const popup = document.createElement("div");
  const level = getLevelFromPattern(patternType);
  popup.className = `scan-popup-box scan-popup-${level}`;

  const icon = document.createElement("div");
  icon.className = "scan-popup-icon";
  icon.innerHTML = {
    critical: "&#9888;",   // ⚠
    warning: "&#128712;",  // 🛈
    info: "&#8505;"        // ℹ
  }[level];
  popup.appendChild(icon);

  const titleEl = document.createElement("h2");
  titleEl.textContent = title;
  popup.appendChild(titleEl);

  const patternEl = document.createElement("p");
  patternEl.textContent = `Loại mối đe dọa: ${patternType}`;
  patternEl.className = "scan-popup-pattern";
  popup.appendChild(patternEl);

  const detailEl = document.createElement("details");
  detailEl.className = "scan-popup-details";
  const summary = document.createElement("summary");
  summary.textContent = "Chi tiết cảnh báo";
  const inner = document.createElement("div");
  inner.textContent = description;
  detailEl.appendChild(summary);
  detailEl.appendChild(inner);
  popup.appendChild(detailEl);

  const btnClose = document.createElement("button");
  btnClose.textContent = "Đóng";
  btnClose.className = "scan-popup-button";
  btnClose.addEventListener("click", () => {
    overlay.remove();
    onClose();
  });
  popup.appendChild(btnClose);

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

function getLevelFromPattern(patternType: string): "info" | "warning" | "critical" {
  const criticalPatterns = [
    "Lừa đảo đe dọa",
    "Lừa đảo văn bản hành chính",
    "Lừa đảo giải thưởng",
    "Lừa đảo hỗ trợ kỹ thuật",
    "Gian lận hóa đơn"
  ];

  if (criticalPatterns.includes(patternType)) {
    return "critical";
  }

  return "info";
}