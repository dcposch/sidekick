import { ensure } from "common/assert";
import { queryCompletion } from "common/query-completion";
import { browser } from "webextension-polyfill-ts";

main();

async function main() {
  // Poor man's React. Calculate state, then render DOM based on state.
  // No vdom, no diff. Very light. We still separate logic from presentation.
  const state = await maybeCreateState();
  state.isPopupOpen = true;
  render(state);
}

interface SidekickState {
  apiKey: string;
  url: string;
  isPopupOpen: boolean;
  query: string;
  matchingQuickActions: QuickAction[];
  selectedIx: number;
}

interface QuickAction {
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
async function maybeCreateState(): Promise<SidekickState> {
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

/** Updates our extension popup (shadow DOM) based on state. */
function render(state: SidekickState) {
  let shadow = document.querySelector("#_sidekick-popup") as HTMLDivElement;
  if (shadow == null) {
    console.log("Creating popup shadow root");
    shadow = createShadow();
  }

  console.log("Rendering popup. Open: " + state.isPopupOpen);
  if (state.isPopupOpen) {
    shadow.style.display = "block";
    renderContents(state, shadow);
  } else {
    shadow.style.display = "none";
  }
}

function renderContents(state: SidekickState, shadow: HTMLDivElement) {
  const popup = shadow.shadowRoot!.children[1] as HTMLDivElement;
  console.log("Rendering popup contents", popup);

  let children = [] as HTMLElement[];
  if (state.apiKey.length === 0) {
    console.log("Rendering no API key");
    children.push(renderNoApiKey());
  } else {
    console.log("Rendering quick actions");
    children.push(renderQuickActions(state));
  }
  popup.replaceChildren(...children);
}

function renderQuickActions(state: SidekickState) {
  const div = document.createElement("div");

  const query = document.createElement("input");
  query.style.border = "none";
  query.style.backgroundColor = "transparent";
  query.style.color = "#ddd";
  div.appendChild(query);

  // TODO
  return div;
}

function renderNoApiKey() {
  const div = document.createElement("div");
  div.style.padding = "8px";

  const h1 = document.createElement("h1");
  h1.textContent = "⚡️ missing API key";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append("Please set your API key in the extension options. ");
  const a = document.createElement("a");
  a.href = "https://platform.openai.com/account/api-keys";
  a.target = "_blank";
  a.textContent = "You can get one for free at OpenAI.";
  p.appendChild(a);
  div.appendChild(p);

  return div;
}

function createShadow(): HTMLDivElement {
  const container = document.createElement("div");
  //container.style.position="absolute";
  container.id = "_sidekick-popup";
  const shadow = container.attachShadow({ mode: "open" });
  shadow.appendChild(createStylesheet());
  shadow.appendChild(createPopup());
  document.body.appendChild(container);
  return container;
}

function createStylesheet(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    :host {
      position: absolute;
      z-index: 99999;
    }

    .popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #333;
      border-radius: 8px;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      padding: 16px;
      font: 16px system-ui, sans-serif;
      color: #ddd;
      line-height: 1.5;
    }

    h1 {
      font-size: 24px;
    }

    a, a:visited {
      color: #ddd;
      text-decoration: none;
    }
  `;
  return style;
}

function createPopup(): HTMLDivElement {
  const popup = document.createElement("div");
  popup.className = "popup";

  popup.addEventListener("keydown", function (ev: KeyboardEvent) {
    console.log(`Keydown: ${ev.key}`);
    if (ev.key === "Escape") {
      closePopup();
    } else if (ev.key === "Up") {
      moveSelection(-1);
    } else if (ev.key === "Down") {
      moveSelection(1);
    }
  });
  return popup;
}

function closePopup() {
  console.log("Closing popup");
  const state = window._sidekickState;
  state.isPopupOpen = false;
  render(state);
}

function moveSelection(dir: number) {
  const state = window._sidekickState;
  state.selectedIx += dir;
  if (state.selectedIx < 0) {
    state.selectedIx = 0;
  } else if (state.selectedIx >= state.matchingQuickActions.length) {
    state.selectedIx = state.matchingQuickActions.length - 1;
  }
  render(state);
}

async function quickActionReplaceSelection(instructions: string) {
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
