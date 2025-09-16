import { StateManager } from "./stateManager";
import { NetworkInterceptor } from "./networkInterceptor";
import { UrlHandler } from "./urlHandler";
import { setupIframeObserver } from "../observer";

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
