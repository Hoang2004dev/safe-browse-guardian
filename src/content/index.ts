//=================================== content/index.ts
import { ContentScriptManager } from "./core/contentScriptManager";
import { initExtractContentListener } from "./core/extractContent";

new ContentScriptManager();
initExtractContentListener();