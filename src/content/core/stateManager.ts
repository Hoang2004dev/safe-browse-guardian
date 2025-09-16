import { safeSendMessage } from "../../shared/utils/safeSendMessage";

export interface ExtensionState {
  extensionEnabled: boolean;
  sandboxEnabled: boolean;
}

export class StateManager {
  private extensionEnabled = true;
  private sandboxEnabled = true;

  constructor(private onChange: (state: ExtensionState) => void) {
    this.init();
    this.listenForStorageChanges();
    this.listenForMessages();
  }

  public async init() {
    // Kiểm tra xem có trong context extension không
    const isExtensionAvailable = (): boolean =>
      typeof chrome !== "undefined" && !!chrome.runtime?.id;

    if (!isExtensionAvailable()) {
      console.warn("⚠️ Extension context is unavailable. Disabling functionality.");
      this.extensionEnabled = false;
      this.sandboxEnabled = false;
      this.onChange(this.getState());
      return;
    }

    // Load state ban đầu từ storage
    chrome.storage.local.get("localDB", ({ localDB }) => {
      this.extensionEnabled = localDB?.extensionEnabled !== false;
      this.sandboxEnabled = localDB?.sandboxEnabled ?? true;
      this.onChange(this.getState());
    });

    // Ngoài ra thử sync state từ background (phòng khi state khác storage)
    try {
      const state = await safeSendMessage<ExtensionState>({
        type: "GET_STATE",
      });
      if (state) {
        this.extensionEnabled = state.extensionEnabled;
        this.sandboxEnabled = state.sandboxEnabled;
        this.onChange(this.getState());
      }
    } catch (err) {
      console.error("⚠️ Failed to fetch state from background:", err);
    }
  }

  private listenForStorageChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes.localDB) {
        const db = changes.localDB.newValue;
        this.extensionEnabled = db?.extensionEnabled !== false;
        this.sandboxEnabled = db?.sandboxEnabled ?? true;
        this.onChange(this.getState());
      }
    });
  }

  private listenForMessages() {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "STATE_CHANGED") {
        this.extensionEnabled = msg.extensionEnabled ?? this.extensionEnabled;
        this.sandboxEnabled = msg.sandboxEnabled ?? this.sandboxEnabled;
        this.onChange(this.getState());
      }
    });
  }

  public isExtensionEnabled() {
    return this.extensionEnabled;
  }

  public isSandboxEnabled() {
    return this.sandboxEnabled;
  }

  public getState(): ExtensionState {
    return {
      extensionEnabled: this.extensionEnabled,
      sandboxEnabled: this.sandboxEnabled,
    };
  }
}
