// popup/router.ts
const routes: { [key: string]: () => void } = {};

export function registerRoute(path: string, render: () => void) {
  routes[path] = render;
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function initRouter(defaultPath = "home") {
  const path = () => window.location.hash.slice(1) || defaultPath;

  window.addEventListener("hashchange", () => {
    routes[path()]?.();
  });

  routes[path()]?.(); // initial load
}
