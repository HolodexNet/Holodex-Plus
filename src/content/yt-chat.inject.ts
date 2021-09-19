import { inject } from "../util";
import browser from "webextension-polyfill";

inject(browser.runtime.getURL("content/yt-chat-overrides.inject.js"));
