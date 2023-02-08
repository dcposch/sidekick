import { ensure } from "common/assert";
import * as browser from "webextension-polyfill";

export interface SidekickState {
  apiKey: string;
  url: string;
  isPopupOpen: boolean;
  query: string;
  matchingQuickActions: QuickAction[];
  selectedIx: number;
}

export interface QuickAction {
  emoji: string;
  title: string;
  description: string;
  instructions: string;
}

declare global {
  interface Window {
    _sidekickState: SidekickState;
  }
}

/** Finds or creates our extension state, storing it globally. */
export async function getState(): Promise<SidekickState> {
  const url = window.location.href;
  let state = window._sidekickState as SidekickState;
  if (state == null || state.url !== url) {
    // Create state for this page.
    console.log(`Creating state for ${url}`);
    const apiKey = (await browser.storage.sync.get("apiKey")).apiKey || "";
    const matchingQuickActions = [
      {
        emoji: "Σ",
        title: "Create LaTeX",
        description: "Convert instructions to LaTeX.",
        instructions:
          "Convert English text to LaTeX. Include an equation environment if necessary.",
      },
    ];

    state = {
      apiKey,
      url,
      isPopupOpen: true,
      query: "",
      matchingQuickActions,
      selectedIx: 0,
    };
    window._sidekickState = state;
  }

  // Update state.
  ensure(state.url === url);
  // TODO: filter & rank QAs based on query

  return state;
}
