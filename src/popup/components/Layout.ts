// popup/components/Layout.ts

export function renderHeader(root: HTMLElement) {
  const header = document.createElement("header");
  header.style.textAlign = "center";
  header.style.marginBottom = "12px";

  header.innerHTML = `
  <div style="
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 12px 0;
  ">
    <div style="font-size: 25px;">🛡️</div>
    <div style="font-size: 19px; font-weight: 600; color: var(--primary);">
      SafeBrowse Guardian
    </div>
  </div>
`;

  root.appendChild(header);
}

export function renderFooter(root: HTMLElement) {
  const footer = document.createElement("footer");
  footer.style.textAlign = "center";
  footer.style.marginTop = "16px";
  footer.style.fontSize = "12px";
  footer.style.color = "var(--muted)";
  footer.style.lineHeight = "1.4";

  footer.innerHTML = `
    © 2009–2025 SafeBrowse Software Ltd.<br/>
    <a href="https://safebrowse.vn" target="_blank" style="color: var(--muted); text-decoration: none;">
      safebrowse.vn
    </a>
  `;

  root.appendChild(footer);
}
