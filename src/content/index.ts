import { browser } from "webextension-polyfill-ts";

console.log("Hello from content script");

const DEFAULT_PARAMS = {
  model: "text-davinci-003",
  temperature: 0.9,
  max_tokens: 400,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// TODO: show quick actions menu
quickActionReplaceSelection(
  "Convert English text to LaTeX. Include an equation environment if necessary."
);

export async function query(apiKey: string, prompt: string) {
  const params = { ...DEFAULT_PARAMS, prompt };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(params),
  };
  const response = await fetch(
    "https://api.openai.com/v1/completions",
    requestOptions
  );
  const data = await response.json();
  return data;
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
  const response = await query(apiKey, prompt);
  const result = response.choices[0].text.trim();
  document.body.style.cursor = "default";

  selRange.deleteContents();
  selRange.insertNode(document.createTextNode(result));
}
