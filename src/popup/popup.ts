// popup/popup.ts
import { registerRoute, initRouter } from "./router";
import { renderHome } from "./pages/home";
import { renderBlacklist } from "./pages/blacklist";
import { renderWarnings } from "./pages/warnings";
import { renderSettings } from "./pages/settings";

registerRoute("home", renderHome);
registerRoute("blacklist", renderBlacklist);
registerRoute("warnings", renderWarnings);
registerRoute("settings", renderSettings);

chrome.storage.local.get("darkMode", ({ darkMode }) => {
  if (darkMode) document.body.classList.add("dark");
});

initRouter();

