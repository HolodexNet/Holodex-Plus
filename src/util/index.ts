import { runtime } from "webextension-polyfill";

export const HOLODEX_URL_REGEX = /^(?:[^:]+:\/\/)?(?:[^\/]+\.)?holodex.net\b/i;

export const CHANNEL_URL_REGEX = /\b[A-Za-z0-9\-_]{24}\b/;

export const VIDEO_URL_REGEX = /\b[A-Za-z0-9\-_]{11}\b/;

export const CANONICAL_URL_REGEX = /\/(?:channel\/[A-Za-z0-9\-_]{24}|(?:shorts\/|watch\?v=)[A-Za-z0-9\-_]{11})\b/;

/**
 * Inject a script onto the page. Script must be
 * accessible via `runtime.getURL` - add it to
 * `accessible` in rollup config first.
 */
export function inject(scriptPath: string) {
  const el = document.createElement("script");
  el.src = runtime.getURL(scriptPath);
  el.type = "text/javascript";
  document.head.appendChild(el);
  return el;
}

type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];

/**
 * Same as `Object.entries`, but strongly typed.
 *
 * **Only use this for constant objects!**
 */
export function entries<T>(object: T): Entries<T> {
  return Object.entries(object as any) as any;
}

/**
 * Split `text` into fragments, where each fragment
 * after the first starts with an upper-case letter.
 *
 * Example:
 * ```ts
 * splitOnUpperCase("someTextWithUpperCase") // ["some", "Text", "With", "Upper", "Case"]
 * ```
 */
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
/**
 * Encode a string as SHA1
 */
export async function sha1(message: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-1", encoder.encode(message)));
  let hash = "";
  for (let i = 0; i < bytes.length; ++i) {
    hash += bytes[i].toString(16).padStart(2, "0");
  }
  return hash;
}

/**
 * Creates an SVG element with `className=${clazz}`,
 * and a child path with `d=${d}`
 */
export const svg = (d: string, clazz?: string) => {
  const xmlns = "http://www.w3.org/2000/svg";

  const out = document.createElementNS(xmlns, "svg");
  out.setAttributeNS(null, "viewBox", "0 0 24 24");
  if (clazz) out.classList.add(...clazz.split(" "));
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttributeNS(null, "d", d);
  out.appendChild(path);
  return out;
};

/**
 * Wait until an element can be found using `selector`.
 *
 * Most web apps don't render the whole page at once,
 * so attempting to modify a web app's content at document
 * load will probably fail. This is slightly more reliable.
 */
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

export function validOrigin(origin: string) {
  return origin.match(/^https?:\/\/(localhost:|(\S+\.)?holodex\.net)/i);
}

export * from "./storage";
import * as ipc from "./ipc";

export { ipc };
