import browser from "webextension-polyfill";

const isBackgroundPage = !!browser.tabs;

export function setupProxy() {
  if (isBackgroundPage) {
    browser.runtime.onMessage.addListener((message, sender) => {
      if (message.proxy && sender.tab?.id) {
        browser.tabs.sendMessage(sender.tab.id, message);
      }
    });
  }
}

export function on<T>(topic: string, callback: (message: T | null) => void) {
  browser.runtime.onMessage.addListener((message) => {
    if (message.topic === topic) {
      callback(message.data);
    }
  });
}

export function off<T>(topic: string, callback: (message: T | null) => void) {
  browser.runtime.onMessage.removeListener(callback);
}

export function send<T>(topic: string, message: T | null = null) {
  browser.runtime.sendMessage(browser.runtime.id, {
    proxy: true,
    topic,
    data: message,
  });
}
