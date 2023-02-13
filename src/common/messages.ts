import * as browser from "webextension-polyfill";
import { Transform } from "./transform";

/** Message from tab (content script) to background process. */
export type MessageCtoB =
  | {
      type: "openOptionsPage";
    }
  | {
      type: "applyTransform";
      transform: Transform;
    };

/** Send a message from content script to background. */
export function messageToBackground(message: MessageCtoB) {
  return browser.runtime.sendMessage(message);
}
