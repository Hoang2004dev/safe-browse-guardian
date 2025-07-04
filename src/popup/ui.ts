// popup/ui.ts

/** Tạo phần tử với class và text */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; textContent?: string } = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;
  if (options.textContent) el.textContent = options.textContent;
  return el;
}

/** Xoá toàn bộ con trong phần tử */
export function clearElement(el: HTMLElement) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
