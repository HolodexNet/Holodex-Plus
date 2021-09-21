import { runtime } from "webextension-polyfill";

export function inject(scriptPath: string) {
  const el = document.createElement("script");
  el.src = runtime.getURL(scriptPath);
  el.type = "text/javascript";
  document.head.appendChild(el);
  return el;
}

export function entries<T>(object: T): [keyof T, T[keyof T]][] {
  return Object.entries(object) as any;
}

export function splitOnUpperCase(text: string): string[] {
  const result = new Array<string>();
  let s = 0;
  for (let i = 0; i < text.length; ++i) {
    if (text[i].toUpperCase() === text[i]) {
      result.push(text.substring(s, i));
      s = i;
    }
  }
  if (text.length - s > 1) result.push(text.substring(s));
  return result;
}

const encoder = new TextEncoder();
export async function sha1(message: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-1", encoder.encode(message)));
  let hash = "";
  for (let i = 0; i < bytes.length; ++i) {
    hash += bytes[i].toString(16).padStart(2, "0");
  }
  return hash;
}

export function waitForEl(selector: string) {
  return new Promise<Element>((resolve) => {
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(interval);
        resolve(el);
      }
    }, 200);
  });
}

type ThemeChangeCallback = (theme: "theme--dark" | "theme--light") => void;
let themeChangeListeners = new Set<ThemeChangeCallback>();
export function onThemeChange(callback: ThemeChangeCallback) {
  themeChangeListeners.add(callback);
}

waitForEl("#app").then((root) => {
  new MutationObserver(() => {
    const theme: "theme--dark" | "theme--light" = root.classList.contains("theme--dark")
      ? "theme--dark"
      : "theme--light";
    themeChangeListeners.forEach((f) => f(theme));
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
});

export * from "./storage";
import * as ipc from "./ipc";

export { ipc };
