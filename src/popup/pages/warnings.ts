// popup/pages/warnings.ts
import { renderHeader, renderFooter } from "../components/Layout";
import { renderNav } from "../components/Navigation";
import { renderWarningsSection } from "../components/WarningsView";

export function renderWarnings() {
  const root = document.body;
  root.innerHTML = "";

  renderHeader(root);
  renderNav(root);
  renderWarningsSection(root);
  renderFooter(root);
}
