import { storage } from "webextension-polyfill";

export const OptionsSchema = {
  liveChatMemoryLeakFix: true,
  remoteLikeButton: true,
};

export const OptionsDescription: Partial<Record<keyof typeof OptionsSchema, string>> = {
  liveChatMemoryLeakFix:
    "YouTube live chat has a bug where some scheduled tasks are never executed. This patches the scheduler to ensure the memory held by those tasks can be garbage collected.",
};

export type OptionsData = {
  [K in keyof typeof OptionsSchema]: typeof OptionsSchema[K];
};

export const Options = {
  async get<K extends keyof OptionsData>(key: K): Promise<OptionsData[K] | null> {
    const result = await storage.local.get(key);
    return key in result ? result[key] : OptionsSchema[key];
  },
  async set<K extends keyof OptionsData>(key: K, value: OptionsData[K]): Promise<void> {
    await storage.local.set({ [key]: value });
  },
  subscribe(callback: (changes: { [K in keyof OptionsData]?: browser.Storage.StorageChange }) => void) {
    storage.onChanged.addListener((changes, type) => {
      if (type !== "local") return;
      callback(changes);
    });
  },
} as const;
