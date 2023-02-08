import { queryCompletion } from "common/query-completion";
import * as browser from "webextension-polyfill";
import { render } from "./render";
import { getState, SidekickState } from "./state";

export type Action =
  | {
      type: "openPopup";
    }
  | {
      type: "selectQuickAction";
      dir: number;
    }
  | {
      type: "executeQuickAction";
    }
  | {
      type: "closePopup";
    };

/** Global dispatcher. All changes to the state go thru here. */
export async function dispatch(action: Action) {
  const state = await getState();
  switch (action.type) {
    case "openPopup":
      state.isPopupOpen = true;
      break;
    case "selectQuickAction":
      selectQuickAction(state, action.dir);
      break;
    case "executeQuickAction":
      const quickAction = state.matchingQuickActions[state.selectedIx];
      quickActionReplaceSelection(quickAction.instructions);
      break;
    case "closePopup":
      state.isPopupOpen = false;
      break;
    default:
      console.log(`Ignoring unknown action type`, action);
  }
  render(state);
}

function selectQuickAction(state: SidekickState, dir: number) {
  state.selectedIx += dir;
  if (state.selectedIx < 0) {
    state.selectedIx = 0;
  } else if (state.selectedIx >= state.matchingQuickActions.length) {
    state.selectedIx = state.matchingQuickActions.length - 1;
  }
}

export async function quickActionReplaceSelection(instructions: string) {
  const { apiKey } = await browser.storage.sync.get("apiKey");
  if (apiKey == null || apiKey.length === 0) {
    console.log("Missing API key");
    return;
  }

  const sel = document.getSelection();
  if (sel == null || sel.rangeCount !== 1) {
    console.log("No selection");
    return;
  }

  const selRange = sel.getRangeAt(0);
  const text = sel.toString();
  console.log(`QA Replace Sel. Instructions: ${instructions}. Text: ${text}`);

  var prompt = `${instructions} \nQ: ${text}\n A:`;

  document.body.style.cursor = "wait";
  const response = await queryCompletion(apiKey, prompt);
  const result = response.choices[0].text.trim();
  document.body.style.cursor = "default";

  selRange.deleteContents();
  selRange.insertNode(document.createTextNode(result));
}
