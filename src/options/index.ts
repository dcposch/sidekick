import * as browser from "webextension-polyfill";

loadOptions();

document.forms[0].addEventListener("submit", function (e) {
  e.preventDefault();
  saveOptions();
});

async function loadOptions() {
  const input = document.querySelector("#openai-api-key") as HTMLInputElement;
  const { apiKey } = await browser.storage.sync.get("apiKey");
  input.value = apiKey || "";
}

async function saveOptions() {
  const input = document.querySelector("#openai-api-key") as HTMLInputElement;
  const apiKey = input.value.trim();

  const status = document.querySelector("#save-status") as HTMLDivElement;
  if (
    apiKey.length > 0 &&
    (!apiKey.startsWith("sk-") || apiKey.length !== 51)
  ) {
    status.textContent = "Invalid API key";
    status.classList.add("error");
    return;
  }

  await browser.storage.sync.set({ apiKey });
  status.textContent = "Saved";
  status.classList.remove("error");
}
