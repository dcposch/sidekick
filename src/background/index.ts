console.log("Background script hello world");

/** The action is triggered by clicking on the extension, or Ctrl+E */
chrome.action.onClicked.addListener((tab) => {
  if (tab.id == null || tab.url == null || !tab.url.startsWith("http")) {
    console.log(`Skipping action for non-http tab: ${tab.url}`);
    return;
  }

  /** Execute content script, show quick actions. Doing this on action only
   *  avoids the scary "this extension has access to all sites" permission. */
  console.log("Action triggered");
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content/index.js"],
  });
});
