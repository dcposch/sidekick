import { MessageCtoB } from "common/messages";
import { Transform } from "common/transform";
import * as browser from "webextension-polyfill";

/** Receive messages from the tab. */
browser.runtime.onMessage.addListener(async (message: MessageCtoB, sender) => {
  console.log("Background received message from tab", message, sender);

  switch (message.type) {
    case "openOptionsPage":
      browser.runtime.openOptionsPage();
      break;
    case "applyTransform":
      console.log("applyTransform", message.transform);
      await applyTransform(message.transform);
      break;
    default:
      console.log("Unknown message type", message);
  }
});

/** Save which transform we're about to run, then invoke the content script. */
async function applyTransform(transform: Transform) {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  console.log(`Found ${tabs.length} active tab(s) in the current window`, tabs);
  const tab = tabs[0];

  if (
    tab == null ||
    tab.id == null ||
    tab.url == null ||
    !tab.url.startsWith("http")
  ) {
    console.log(`Skipping action for non-http tab: ${tab?.url}`);
    return;
  }

  /** Tell the script which transform to run. */
  await browser.storage.local.set({ currentTransform: transform });

  /** Execute content script. */
  browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content/index.js"],
  });
}
