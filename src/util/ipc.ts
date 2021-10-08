import { runtime, tabs } from "webextension-polyfill";

const isBackgroundPage = !!tabs;

/**
 * Enable proxying IPC messages. This should be called only in a background page.
 * It enables secure cross-iframe communication.
 */
export function setupProxy() {
  if (isBackgroundPage) {
    runtime.onMessage.addListener((message: Message<any>, sender) => {
      if (message.proxy && sender.tab?.id) {
        tabs.sendMessage(sender.tab.id, message);
      }
      else {
        
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
  runtime.onMessage.addListener((message: Message<T>) => {
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
  runtime.sendMessage(runtime.id, message);
}
