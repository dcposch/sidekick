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
      setBadge(message.transform);
      browser.storage.local.set({ currentTransform: message.transform });
      break;
    default:
      console.log("Unknown message type", message);
  }
});

/** Sets the "badge" to show the user which transform is selected. */
function setBadge(transform: Transform) {
  browser.action.setBadgeText({ text: transform.emoji });
  browser.action.setBadgeBackgroundColor({ color: "#35363A" });
}
