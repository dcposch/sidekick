import { MessageCtoB } from "common/messages";
import { Transform } from "common/transform";
import * as browser from "webextension-polyfill";

console.log("Background script hello world");

/** The action is triggered by clicking on the extension, or Ctrl+E */
// browser.action.onClicked.addListener((tab) => {
//   if (tab.id == null || tab.url == null || !tab.url.startsWith("http")) {
//     console.log(`Skipping action for non-http tab: ${tab.url}`);
//     return;
//   }

//   /** Execute content script, show quick actions. Doing this on action only
//    *  avoids the scary "this extension has access to all sites" permission. */
//   console.log("Action triggered");
//   browser.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ["content/index.js"],
//   });
// });

// let currentTransform: Transform | null = null;

browser.commands.onCommand.addListener(
  (command: string, tab?: browser.Tabs.Tab) => {
    console.log(`Command ${command} triggered`);
    if (command !== "transform") return;
    if (tab == null || tab.id == null) return;

    /** Execute content script, execute transform. */
    // console.log(`Executing current transform: ${currentTransform.emoji}`);
    browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/index.js"],
    });
  }
);

/** Receive messages from the tab. */
browser.runtime.onMessage.addListener(async (message: MessageCtoB, sender) => {
  console.log("Background received message from tab", message, sender);

  switch (message.type) {
    case "openOptionsPage":
      browser.runtime.openOptionsPage();
      break;
    case "selectTransform":
      console.log("selectTransform", message.transform);
      await browser.action.setBadgeBackgroundColor({ color: "#35363A" });
      browser.action.setBadgeText({ text: message.transform.emoji });
      browser.storage.local.set({ currentTransform: message.transform });
      break;
    default:
      console.log("Unknown message type", message);
  }
});
