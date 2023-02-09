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

  console.log("Rendering popup: " + state.popup);
  if (state.popup === "none") {
    shadow.style.display = "none";
  } else {
    shadow.style.display = "block";
    const popup = shadow.shadowRoot!.children[1] as HTMLDivElement;
    popup.replaceChildren(renderContents(state));
  }
}

function renderContents(state: SidekickState) {
  switch (state.popup) {
    case "no-api-key":
      return renderNoApiKey();
    case "no-transform":
      return renderNoTransform();
    case "no-selection":
      return renderNoSelection();
    case "selection-too-long":
      return renderSelectionTooLong();
    case "none":
      throw new Error();
    default:
      if (state.popup.type === "error") {
        return renderError(state.popup.message);
      }
      throw new Error(`Unknown popup type: ${state.popup}`);
  }
}

function renderError(message: string) {
  const div = document.createElement("div");

  const h1 = document.createElement("h1");
  h1.innerHTML = "⚡️ &nbsp; Transform error";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append(`Sorry, that didn't work.`);
  div.appendChild(p);

  const p2 = document.createElement("p");
  p2.append(message);
  div.appendChild(p2);

  return div;
}

function renderNoTransform() {
  const div = document.createElement("div");

  const h1 = document.createElement("h1");
  h1.innerHTML = "⚡️ &nbsp; No transform selected";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append(`Use ${getShortcut("Shift+E")} to select a transform.`);
  div.appendChild(p);

  return div;
}

function renderNoSelection() {
  const div = document.createElement("div");

  const h1 = document.createElement("h1");
  h1.innerHTML = "⚡️ &nbsp; No selection";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append(
    `Did you select editable text? We don't support certain websites with funky selection mechanics yet, like Google Docs.`
  );
  div.appendChild(p);

  return div;
}

function renderSelectionTooLong() {
  const div = document.createElement("div");

  const h1 = document.createElement("h1");
  h1.innerHTML = "⚡️ &nbsp; Selection too long";
  div.appendChild(h1);

  const p = document.createElement("p");
  p.append(`The AI has a length limitation. Try selecting less text.`);
  div.appendChild(p);

  return div;
}

function getShortcut(suffix: string) {
  const isMac = window.navigator.userAgent.toLowerCase().includes("mac");
  return (isMac ? "Cmd" : "Ctrl") + "+" + suffix;
}

function renderNoApiKey() {
  const div = document.createElement("div");

  const h1 = document.createElement("h1");
  h1.innerHTML = "⚡️ &nbsp; Missing API key";
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

  document.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "closePopup" });
      }
    },
    { capture: true }
  );

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
        font-size: 18px;
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
        width: 384px;
        padding: 16px;
      }

      .popup p {
        padding: 0 8px;
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
    }
  });
  return popup;
}
