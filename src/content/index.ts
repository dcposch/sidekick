import * as browser from "webextension-polyfill";
import { quickActionReplaceSelection } from "./action";

// Poor man's React. Update state, then render DOM based on state.
// No vdom, no diff. Very light. We still separate logic from presentation.
// This entry point runs when we inject the content script, which happens the
// first time the user triggers the extension.
// dispatch({ type: "openPopup" });

main();

async function main() {
  console.log("Content script hello world");
  const { currentTransform } = await browser.storage.local.get(
    "currentTransform"
  );
  console.log("currentTransform", currentTransform);
  if (currentTransform == null) return;

  quickActionReplaceSelection(currentTransform.instructions);
}
