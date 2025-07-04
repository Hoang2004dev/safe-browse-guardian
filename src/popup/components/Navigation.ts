// popup/components/Navigation.ts

export function renderNav(root: HTMLElement) {
  const nav = document.createElement("nav");
  nav.style.display = "flex";
  nav.style.justifyContent = "space-around";
  nav.style.marginBottom = "12px";
  nav.style.flexWrap = "wrap";
  nav.style.gap = "4px";

  const links = [
    { label: "Trang chủ", hash: "home" },
    { label: "Blacklist", hash: "blacklist" },
    { label: "Cảnh báo", hash: "warnings" },
    { label: "Cài đặt", hash: "settings" },
  ];

  links.forEach(({ label, hash }) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      window.location.hash = hash;
    });
    nav.appendChild(btn);
  });

  root.appendChild(nav);
}
