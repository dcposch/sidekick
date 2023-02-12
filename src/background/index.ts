import { MessageCtoB } from "common/messages";
import { Transform } from "common/transform";
import * as browser from "webextension-polyfill";

init();

async function init() {
  console.log("Initializing background script");
  const { currentTransform } = await browser.storage.local.get(
    "currentTransform"
  );
  if (currentTransform != null) {
    setBadge(currentTransform);
  }
}

/** Command triggered via Cmd/Ctrl+E */
browser.commands.onCommand.addListener(
  (command: string, tab?: browser.Tabs.Tab) => {
    console.log(`Command ${command} triggered`);
    if (command !== "transform") return;
    if (
      tab == null ||
      tab.id == null ||
      tab.url == null ||
      !tab.url.startsWith("http")
    ) {
      console.log(`Skipping action for non-http tab: ${tab?.url}`);
      return;
    }

    /** Execute content script, execute transform. */
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
      await browser.storage.local.set({
        currentTransform: message.transform || null,
      });
      await setBadge(message.transform);
      break;
    default:
      console.log("Unknown message type", message);
  }
});

/** Sets the "badge" to show the user which transform is selected. */
async function setBadge(transform?: Transform) {
  const p1 = browser.action.setBadgeText({ text: transform?.emoji || "" });
  const p2 = browser.action.setBadgeBackgroundColor({ color: "#35363A" });
  await Promise.all([p1, p2]);
  console.log(`Updated the badge to ${transform?.emoji}`);
}
