  import { StateManager } from "./stateManager";
  import { NetworkInterceptor } from "./networkInterceptor";
  import { UrlHandler, analyzeUrlWithContentScript } from "./urlHandler";
  import { setupIframeObserver } from "../observer";
  import { analyzeUrlInSandbox } from "../sandbox/index";
  import type { SandboxReport } from "../sandbox/types";

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
    }

    /**
     * Dừng logic khi extension pause
     */
    private pause() {
      this.networkInterceptor.disable();
      this.urlHandler.disable();
      // TODO: clearInterval, removeEventListener nếu bạn có logic riêng
    }

    /**
     * Resume logic khi extension bật lại
     */
    private resume() {
      this.networkInterceptor.enable();
      this.urlHandler.enable();
    }
  }

  /**
   * Phân tích URL để phát hiện mối đe dọa
   * Ưu tiên sử dụng content script, nếu thất bại thì dùng sandbox
   */
  export async function analyzeUrl(url: string): Promise<SandboxReport> {
    // Ưu tiên dùng content script
    try {
      const report = await analyzeUrlWithContentScript(url);
      // Nếu có dữ liệu, trả về luôn
      if (report.details.length > 0) return report;
    } catch {
      // Nếu lỗi, fallback sang sandbox
    }
    // Dự phòng: dùng sandbox iframe
    return await analyzeUrlInSandbox(url);
  }
