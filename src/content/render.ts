import { messageToBackground } from "common/messages";
import { dispatch } from "./action";
import { SidekickState } from "./state";

/** Updates our extension popup (shadow DOM) based on state. */
export function render(state: SidekickState) {
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

  const input = popup.querySelector(".query-input") as HTMLInputElement;
  if (input != null) input.focus();
}

function renderQuickActions(state: SidekickState) {
  const div = document.createElement("div");
  div.className = "quick-actions";

  const query = document.createElement("input");
  query.className = "query-input";
  div.appendChild(query);

  const list = document.createElement("div");
  list.className = "quick-action-list";
  for (let i = 0; i < state.matchingQuickActions.length; i++) {
    const item = document.createElement("div");
    item.classList.add("quick-action-item");
    if (i === state.selectedIx) {
      item.classList.add("selected");
    }
    const qa = state.matchingQuickActions[i];
    item.textContent = qa.emoji + " " + qa.title;
    list.appendChild(item);
  }
  div.appendChild(list);

  // TODO
  return div;
}

function renderNoApiKey() {
  const div = document.createElement("div");
  div.className = "no-api-key";

  const h1 = document.createElement("h1");
  h1.textContent = "⚡️ missing API key";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append("Please set your API key in the ");
  let a = document.createElement("a");
  a.href = "#";
  a.textContent = "extension options";
  p.appendChild(a);
  p.append(". ");
  a.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    messageToBackground({ type: "openOptionsPage" });
  });

  p.append("You can get one ");
  a = document.createElement("a");
  a.href = "https://platform.openai.com/account/api-keys";
  a.target = "_blank";
  a.textContent = "for free at OpenAI";
  p.appendChild(a);
  p.append(".");
  div.appendChild(p);

  return div;
}

function createShadow(): HTMLDivElement {
  const container = document.createElement("div");
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

      * {
        box-sizing: border-box;
      }

      h1 {
        font-size: 24px;
      }

      a, a:visited {
        color: #ddd;
      }

      .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #222;
        border-radius: 8px;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
        padding: 0;
        font: 16px system-ui, sans-serif;
        color: #ddd;
        line-height: 1.5;
      }

      .no-api-key {
        width: 384px;
        padding: 16px;
      }

      .quick-actions {
        width: 384px;
        min-height: 192px;
      }

      .query-input {
        width: 100%;
        padding: 16px;
        border: none;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        background-color: #444;
        outline: none;
        color: #ddd;
      }

      .quick-action-list {
      }

      .quick-action-item {
        padding: 8px;
        border-top: 1px solid #444;
      }

      .quick-action-item.selected {
        background-color: #333;
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
      dispatch({ type: "closePopup" });
    } else if (ev.key === "Up") {
      dispatch({ type: "selectQuickAction", dir: -1 });
    } else if (ev.key === "Down") {
      dispatch({ type: "selectQuickAction", dir: 1 });
    } else if (ev.key === "Enter") {
      dispatch({ type: "executeQuickAction" });
    }
  });
  return popup;
}
