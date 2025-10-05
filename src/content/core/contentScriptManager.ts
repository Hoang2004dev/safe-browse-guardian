  import { StateManager } from "./stateManager";
  import { NetworkInterceptor } from "./networkInterceptor";
  import { UrlHandler, analyzeUrlWithContentScript } from "./urlHandler";
  import { setupIframeObserver } from "../observer";
  import { analyzeUrlInSandbox } from "../sandbox/index";
  import type { SandboxReport } from "../sandbox/types";
  import { initMessageListener } from "./messageListener";

  export class ContentScriptManager {
    private stateManager!: StateManager;
    private networkInterceptor!: NetworkInterceptor;
    private urlHandler!: UrlHandler;

    constructor() {
      this.bootstrap();
    }

    private async bootstrap() {
      console.log("🚀 ContentScriptManager initialized");

      // 1. Quản lý state bật/tắt
      this.stateManager = new StateManager((enabled) => {
        if (enabled) {
          console.log("▶️ Extension resumed → scripts running");
          this.resume();
        } else {
          console.log("⏸️ Extension paused → scripts stopped");
          this.pause();
        }
      });

      // 2. Interceptor mạng (fetch, XHR)
      this.networkInterceptor = new NetworkInterceptor(() =>
        this.stateManager.isExtensionEnabled()
      );

      // 3. Handler xử lý URL click
      this.urlHandler = new UrlHandler(
        () => this.stateManager.isExtensionEnabled(),
        () => this.stateManager.isSandboxEnabled()
      );

      // 4. Observer cho iframe độc hại
      setupIframeObserver();

      // 5. Load trạng thái ban đầu
      await this.stateManager.init();

      // 6. Lắng nghe message từ background
      initMessageListener();
    }

    /**
     * Dừng logic khi extension pause
     */
    private pause() {
      this.networkInterceptor.disable();
      this.urlHandler.disable();
    }

    //  Resume logic khi extension bật lại
    private resume() {
      this.networkInterceptor.enable();
      this.urlHandler.enable();
    }
  }

  // Phân tích URL để phát hiện mối đe dọa
  export async function analyzeUrl(url: string): Promise<SandboxReport> {
    try {
      const report = await analyzeUrlWithContentScript(url);
      if (report.details.length > 0) return report;
    } catch {
    }
    return await analyzeUrlInSandbox(url);
  }
