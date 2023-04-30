import { runtime } from "webextension-polyfill";

const HOLODEX_URL_REGEX = /^(?:[^:]+:\/\/)?(?:[^\/]+\.)?holodex.net\b/i;

// This needs to match the YouTube URL matching in generate-manifest.js.
const YOUTUBE_HOSTNAME_REGEX = /^(?:[^\/]+\.)?youtube.com/i;

const FEED_PATHNAME_REGEX = /^(?:\/?$|\/feed\b)/i; // pathname matches homepage or any feed like subscriptions

const CHANNEL_URL_REGEX = /(?<=[=\/?&#])[A-Za-z0-9\-_]{24}(?=[=\/?&#]|$)/;

const VIDEO_URL_REGEX = /(?<=[=\/?&#])[A-Za-z0-9\-_]{11}(?=[=\/?&#]|$)/;

export const CANONICAL_URL_REGEX = /\/(?:channel\/[A-Za-z0-9\-_]{24}|(?:shorts\/|watch\?v=)[A-Za-z0-9\-_]{11})\b/;

/**
 * Returns a promise resolving to the Holodex URL for given URL.
 * Supports returning Holodex channel and watch Holodex URLs,
 * and defaults to Holodex homepage for non-YT URLs and YT homepage & feeds.
 * For other YT URLs, including the new @<channel> URLs, delegates to given handler,
 * which is passed the given URL and returns a promise resolving to a YT canonical URL,
 * from which to derive the Holodex URL from.
 */
export async function getHolodexUrl(url: string | undefined, findCanonicalUrl: (url: string) => Promise<string | null>) {
  if (url) {
    if (HOLODEX_URL_REGEX.test(url)) {
      return null;
    }
    const videoMatch = url.match(VIDEO_URL_REGEX);
    if (videoMatch) {
      return `https://holodex.net/watch/${videoMatch[0]}`;
    }
    const channelMatch = url.match(CHANNEL_URL_REGEX);
    if (channelMatch) {
      return `https://holodex.net/channel/${channelMatch[0]}`;
    }
    const urlObj = new URL(url);
    if (YOUTUBE_HOSTNAME_REGEX.test(urlObj.hostname) && !FEED_PATHNAME_REGEX.test(urlObj.pathname)) {
      const canonicalUrl = await findCanonicalUrl(url);
      if (canonicalUrl) {
        const videoMatch = canonicalUrl.match(VIDEO_URL_REGEX);
        if (videoMatch) {
          return `https://holodex.net/watch/${videoMatch[0]}`;
        }
        const channelMatch = canonicalUrl.match(CHANNEL_URL_REGEX);
        if (channelMatch) {
          return `https://holodex.net/channel/${channelMatch[0]}`;
        }
      }
    }
  }
  return "https://holodex.net";
}

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
 * Wait until an element exists by id.
 *
 * Most web apps don't render the whole page at once,
 * so attempting to modify a web app's content at document
 * load will probably fail. This is slightly more reliable.
 */
export function waitForElementId(id: string, root: Element | Document | null = null) {
  return new Promise<Element>((resolve) => {
    new MutationObserver((mutations, observer) => {
      const element = document.getElementById(id);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    }).observe(root ?? document, { childList: true, subtree: true });
  });
}

export function validOrigin(origin: string) {
  return origin.match(/^https?:\/\/(localhost:|(\S+\.)?holodex\.net)/i);
}

interface SearchObjectItem {
  val: any;
  prop: string;
  parent: SearchObjectItem | null;
}

/**
 * Recursively searches an object and its entries until given predicate is satisfied,
 * i.e. returns truthy value, and returns that truthy value.
 * If the predicate is never satisfied, returns the last (falsy) value it returned.
 *
 * The predicate is passed: {
 *    val: property value, or given object at root),
 *    prop: property name, or '' at root),
 *    parent: parent {val, prop, parent} object (this is a recursive data structure), or null at root
 * }
 *
 * Supports de-facto entries() protocol used by Map and Set (and Array) types,
 * along with standard object enumeration ([own property, value] entries).
 * This does mean extra properties on objects that aren't included in entries() won't be iterated over.
 */
export function searchObject<T>(obj: any, predicate: (val: SearchObjectItem) => T) {
  return searchObjectHelper({val: obj, prop: "", parent: null}, predicate, new Set());
}

function searchObjectHelper<T>(item: SearchObjectItem, predicate: (val: SearchObjectItem) => T, walked: Set<any>) {
  let result = predicate(item);
  if (result) return result;
  const obj = item.val;
  if (walked.has(obj)) return result;
  walked.add(obj);
  if (obj === undefined || typeof obj !== "object") return result;
  // Support de-facto entries() protocol used by Map and Set (and Array) types, along with standard object enumeration.
  // This does mean extra properties on objects of such types that aren't included in entries() won't be iterated over.
  const entries = typeof obj.entries === "function" ? obj.entries() : Object.entries(obj);
  for (const [prop, val] of entries) {
    result = searchObjectHelper({val, prop, parent: item}, predicate, walked);
    if (result) return result;
  }
  return result;
}

export * from "./storage";
import * as ipc from "./ipc";

export { ipc };
