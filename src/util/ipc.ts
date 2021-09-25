import browser from "webextension-polyfill";

const isBackgroundPage = !!browser.tabs;

export function setupProxy() {
  if (isBackgroundPage) {
    browser.runtime.onMessage.addListener((message: Message<any>, sender) => {
      if (message.proxy && sender.tab?.id) {
        browser.tabs.sendMessage(sender.tab.id, message);
      }
    });
  }
}

interface Message<T> {
  proxy: boolean;
  topic: string;
  data: T | null;
}

export function on<T>(topic: string, callback: (message: T | null) => void) {
  browser.runtime.onMessage.addListener((message: Message<T>) => {
    if (message.topic === topic) {
      callback(message.data);
    }
  });
}

export function send<T>(topic: string, data: T | null = null) {
  const message: Message<T> = { proxy: true, topic, data };
  browser.runtime.sendMessage(browser.runtime.id, message);
}
