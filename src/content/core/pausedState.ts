// Quản lý flag runtime + persist
import { getDB } from "../../popup/storage";

let isPaused = false;

// Init từ DB khi content script load
export async function initPausedState() {
  try {
    const db = await getDB();
    isPaused = db.paused ?? false;
  } catch (err) {
    console.warn("⚠️ Could not initialize paused state:", err);
    isPaused = false;
  }
}

export function getPaused() {
  return isPaused;
}

export async function setPaused(paused: boolean) {
  isPaused = paused;
  try {
    const db = await getDB();
    db.paused = paused;
    await db.save?.(); // nếu getDB trả object có method save
  } catch (err) {
    console.warn("⚠️ Could not persist paused state:", err);
  }
}
