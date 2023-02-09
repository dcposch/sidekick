import {
  APPROX_CHARS_PER_TOKEN,
  CompletionResponse,
  CompletionSummary,
  queryCompletion,
} from "common/query-completion";
import * as browser from "webextension-polyfill";
import { render } from "./render";
import { getReplaceableSelection, ReplaceableSelection } from "./selection";
import { getState, SidekickState } from "./state";

export type Action =
  | {
      type: "tryTransform";
    }
  | {
      type: "closePopup";
    };

const MAX_SEL_TOKENS = 1000;
const MAX_SEL_CHARS = MAX_SEL_TOKENS * APPROX_CHARS_PER_TOKEN;

/** Global dispatcher. All changes to the state go thru here. */
export async function dispatch(action: Action) {
  const state = getState();
  switch (action.type) {
    case "tryTransform":
      await tryTransform(state);
      break;
    case "closePopup":
      state.popup = "none";
      break;
    default:
      console.log(`Ignoring unknown action type`, action);
  }
  render(state);
}

async function tryTransform(state: SidekickState) {
  if (state.popup !== "none") {
    // User is invoking sidekick again while seeing an error message.
    // Just close the popup.
    state.popup = "none";
    return;
  }

  const { storage } = browser;
  const { apiKey } = await storage.sync.get("apiKey");
  if (apiKey == null || apiKey.length === 0) {
    state.popup = "no-api-key";
    return;
  }

  const { currentTransform } = await storage.local.get("currentTransform");
  console.log("Got current transform", currentTransform);
  if (currentTransform == null) {
    state.popup = "no-transform";
    return;
  }

  const selection = getReplaceableSelection();
  console.log("Got selection", selection, selection?.text);
  if (selection == null || selection.text === "") {
    state.popup = "no-selection";
    return;
  } else if (selection.text.length > MAX_SEL_CHARS) {
    state.popup = "selection-too-long";
    return;
  }

  const { requestMs } = await storage.local.get("requestMs");
  if (requestMs != null && Date.now() - requestMs < 60_000) {
    console.log("Ignorning transform action, request already in progress.");
    return;
  }
  await storage.local.set({ requestMs: Date.now() });
  await transformReplaceSelection(
    state,
    selection,
    currentTransform.instructions,
    apiKey
  );
  await storage.local.set({ requestMs: null });
}

export async function transformReplaceSelection(
  state: SidekickState,
  selection: ReplaceableSelection,
  instructions: string,
  apiKey: string
) {
  const text = selection.text;
  console.log(`QA Replace Sel. Instructions: ${instructions}. Text: ${text}`);

  var prompt = `${instructions} \nQ: ${text}\n A:`;

  try {
    document.body.style.cursor = "wait";
    const res = await queryCompletion(apiKey, prompt);
    if (res.success) {
      const result = res.body.choices[0].text.trim();
      console.log(`Replacing selection with: ${result}`);
      selection.replace(result);
    } else {
      state.popup = { type: "error", message: res.body.error.message };
    }

    logCompletion(text, prompt, res);
  } catch (e) {
    console.error("Query error", e);
    state.popup = {
      type: "error",
      message: "Couldn't query OpenAI. Are you offline?",
    };
  }
  document.body.style.cursor = "default";
}

async function logCompletion(
  text: string,
  prompt: string,
  resp: CompletionResponse
) {
  const numCharsText = text.length;
  const numCharsPrompt = prompt.length;

  let numCharsCompletion = resp.success ? resp.body.choices[0].text.length : 0;
  const summary = {
    timeUtc: Math.floor(resp.startMs / 1000),
    responseMs: resp.responseMs,
    params: resp.params,
    numCharsText,
    numCharsPrompt,
    numCharsCompletion,
  } as CompletionSummary;

  let { completions } = await browser.storage.local.get("completions");
  completions = completions || [];
  completions.push(summary);
  if (completions.length > 100) completions.unshift();
  // TODO: also keep summary stats by model

  await browser.storage.local.set({ completions });
}
