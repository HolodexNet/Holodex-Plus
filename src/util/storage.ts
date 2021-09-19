import browser from "webextension-polyfill";

export const OptionsSchema = {
  liveChatMemoryLeakFix: "boolean",
} as const;

interface TypeNameMap {
  boolean: boolean;
  string: string;
}

export type OptionsData = {
  [K in keyof typeof OptionsSchema]: TypeNameMap[typeof OptionsSchema[K]];
};

export const Options = {
  async get<K extends keyof OptionsData>(key: K): Promise<OptionsData[K] | null> {
    const result = await browser.storage.local.get(key);
    return key in result ? result[key] : null;
  },
  async set<K extends keyof OptionsData>(key: K, value: OptionsData[K]): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  },
  subscribe(callback: (changes: { [K in keyof OptionsData]?: browser.Storage.StorageChange }) => void) {
    browser.storage.onChanged.addListener((changes, type) => {
      if (type !== "local") return;
      callback(changes);
    });
  },
} as const;
