import * as browser from "webextension-polyfill";
import { Transform } from "./transform";

/** Message from tab (content script) to background process. */
export type MessageCtoB =
  | {
      type: "openOptionsPage";
    }
  | {
      type: "selectTransform";
      transform?: Transform;
    };

/** Message from background process to tab (content script). */
export type MessageBtoC = {
  type: "todo";
};

/** Send a message from content script to background. */
export function messageToBackground(message: MessageCtoB) {
  return browser.runtime.sendMessage(message);
}

/** Send message from background to content script. */
export function messageToTab(tabId: number, message: MessageBtoC) {
  return browser.tabs.sendMessage(tabId, message);
}
