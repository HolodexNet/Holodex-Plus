import { storage } from "webextension-polyfill";

const schema = {
  liveChatMemoryLeakFix: true,
  remoteLikeButton: true,
};
type Schema = typeof schema;
const descriptions: Partial<Record<keyof Schema, string>> = {
  liveChatMemoryLeakFix:
    "YouTube live chat has a bug where some scheduled tasks are never executed. This patches the scheduler to ensure the memory held by those tasks can be garbage collected.",
};

export const Options = {
  schema(): Schema {
    return { ...schema };
  },

  description<K extends keyof Schema>(key: K): string | null {
    return descriptions[key] ?? null;
  },

  async get<K extends keyof Schema>(key: K): Promise<Schema[K] | null> {
    const result = await storage.local.get(key);
    return key in result ? result[key] : schema[key];
  },

  async set<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void> {
    await storage.local.set({ [key]: value });
  },

  subscribe(callback: (changes: { [K in keyof Schema]?: browser.Storage.StorageChange }) => void) {
    storage.onChanged.addListener((changes, type) => {
      if (type !== "local") return;
      callback(changes);
    });
  },
} as const;
