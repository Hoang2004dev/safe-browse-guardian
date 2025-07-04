// popup/pages/blacklist.ts
import { renderHeader, renderFooter } from "../components/Layout";
import { renderNav } from "../components/Navigation";
import { renderBlacklistSection } from "../components/BlacklistView";

export function renderBlacklist() {
  const root = document.body;
  root.innerHTML = "";

  renderHeader(root);
  renderNav(root);
  renderBlacklistSection(root);
  renderFooter(root);
}
