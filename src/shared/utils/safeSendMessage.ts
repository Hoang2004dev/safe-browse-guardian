
import { getPaused } from "../../content/core/pausedState";

export async function safeSendMessage<T = any>(message: any, retries = 2): Promise<T | undefined> {
  if (getPaused()) {
    console.warn("⏸️ Extension is paused → skip safeSendMessage:", message);
    return undefined;
  }
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (
        typeof chrome === "undefined" ||
        !chrome.runtime ||
        !chrome.runtime.id ||
        typeof chrome.runtime.sendMessage !== "function"
      ) {
        console.warn("⚠️ Extension context is invalidated or unavailable.");
        throw new Error("Extension context invalidated");
      }
      
      return await new Promise<T  | undefined>((resolve, reject) => {
        chrome.runtime.sendMessage(message, (res) => {
          if (chrome.runtime.lastError) {
            const msg = chrome.runtime.lastError.message;
            if (msg?.includes("Receiving end does not exist")) {
              console.warn("📭 No content script here, ignoring.");
              return resolve(undefined);
            }
            if (msg?.includes("message port closed")) {
              console.warn("🔄 Background reloaded, skipping.");
              return resolve(undefined);
            }
            return reject(new Error(msg));
          }
          resolve(res as T); // Casting result as T to match expected type
        });
      });
    } catch (err) {
      console.error(`❌ safeSendMessage Exception (attempt ${attempt + 1}):`, err);
      if (attempt === retries) {
        throw err; // Rethrow after max retries
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait before retrying
    }
  }
  return undefined;
}
