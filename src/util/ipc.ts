import browser from "webextension-polyfill";

const isBackgroundPage = !!browser.tabs;

/**
 * Enable proxying IPC messages. This should be called only in a background page.
 * It enables secure cross-iframe communication.
 */
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

/**
 * Listen for messages on a `topic` in the current tab.
 */
export function on<T>(topic: string, callback: (message: T | null) => void) {
  browser.runtime.onMessage.addListener((message: Message<T>) => {
    if (message.topic === topic) {
      callback(message.data);
    }
  });
}

/**
 * Send a message to a `topic` in the current tab.
 */
export function send<T>(topic: string, data: T | null = null) {
  const message: Message<T> = { proxy: true, topic, data };
  browser.runtime.sendMessage(browser.runtime.id, message);
}
