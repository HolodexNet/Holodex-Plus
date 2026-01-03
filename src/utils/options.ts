import { storage } from "webextension-polyfill";

// To add something to options, just add it to `schema`
const schema = {
  // key: default-value
  remoteYoutubeLikeButton: true,
  holodexButtonInYoutube: true,
  openHolodexInNewTab: true,
  // openInHolodexContextMenu: false,
};
type Schema = typeof schema;
const descriptions: Partial<Record<keyof Schema, { name: string, description: string }>> = {
  remoteYoutubeLikeButton: {
    name: "Like Button on Holodex",
    description: "Add a 'Like on YouTube' button to Holodex videos - clicking it will open YouTube in a new tab",
  },
  holodexButtonInYoutube: {
    name: "Holodex Button on YouTube",
    description: "Add a 'View in Holodex' button below YouTube videos for quick access to Holodex features",
  },
  openHolodexInNewTab: {
    name: "Open in New Tab",
    description: "When clicking the extension icon, open Holodex in a new tab instead of the current one",
  },
  // openInHolodexContextMenu: {
  //   name: "Holodex Context Menu",
  //   description: "Add 'Open in Holodex' to the right-click menu for video links",
  // },
};

export const Options = {
  /** Get the options storage schema */
  schema(): Schema {
    return { ...schema };
  },

  /** Get an option's description */
  name<K extends keyof Schema>(key: K): string | null {
    return descriptions[key]?.name ?? null;
  },

  /** Get an option's description */
  description<K extends keyof Schema>(key: K): string | null {
    return descriptions[key]?.description ?? null;
  },

  /** Get an option */
  async get<K extends keyof Schema>(key: K): Promise<Schema[K] | null> {
    const result = await storage.local.get(key);
    return key in result ? result[key] : schema[key];
  },

  /** Set an option */
  async set<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void> {
    await storage.local.set({ [key]: value });
  },

  // This probably shouldn't be used as it is, because it doesn't listen for changes
  // in *just* the options storage.
  /**
   * Listen for changes in the options storage
   */
  /* subscribe(callback: (changes: { [K in keyof Schema]?: browser.Storage.StorageChange }) => void) {
    storage.onChanged.addListener((changes, type) => {
      if (type !== "local") return;
      callback(changes);
    });
  }, */
} as const;