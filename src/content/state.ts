export interface SidekickState {
  popup:
    | "none"
    | "no-api-key"
    | "no-transform"
    | "no-selection"
    | "selection-too-long"
    | { type: "error"; message: string };
}

declare global {
  interface Window {
    _sidekickState: SidekickState;
  }
}

/** Finds or creates our extension state, storing it globally. */
export function getState(): SidekickState {
  let state = window._sidekickState as SidekickState;
  if (state == null) {
    console.log(`Creating state`);
    state = {
      popup: "none",
    };
    window._sidekickState = state;
  }

  return state;
}
