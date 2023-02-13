import { TransformSummary } from "content/action";
import * as browser from "webextension-polyfill";

export interface Transform {
  emoji: string;
  title: string;
  instructions: string;
}

/**
 * The extension ships with a few default transforms. Users can add their own.
 * The current list of transforms is stored in extension storage, ranked by
 * usage.
 */
export async function getTransforms(): Promise<Transform[]> {
  const { storage } = browser;
  let promT = storage.sync.get("transforms");
  let promH = storage.local.get("history");
  let results = await Promise.all([promT, promH]);
  let transforms = results[0].transforms as Transform[];
  let history = results[1].history as TransformSummary[];

  if (transforms == null) {
    transforms = DEFAULT_TRANSFORMS.slice();
    storage.sync.set({ transforms });
  }
  if (history == null) {
    history = [];
  }

  // Put most-recently-used transforms at the top of the list.
  const historyMap = new Map(history.map((h, i) => [h.transform.title, i]));
  transforms.sort((a, b) => {
    const aIx = historyMap.get(a.title) || -1;
    const bIx = historyMap.get(b.title) || -1;
    return bIx - aIx;
  });

  console.log(`Transforms`, transforms);
  return transforms;
}

export async function saveTransforms(transforms: Transform[]) {
  console.log(`Saving ${transforms.length} transforms`);
  browser.storage.sync.set({ transforms });
}

const DEFAULT_TRANSFORMS: Transform[] = [
  {
    emoji: "♾\uFE0F",
    title: "Create LaTeX",
    instructions:
      "Convert instructions to LaTeX. Include an equation environment if necessary.",
  },
  {
    emoji: "✍️\uFE0F",
    title: "Create Markdown",
    instructions: "Convert instructions to Markdown. Use a table if necessary.",
  },
  {
    emoji: "🇺🇸",
    title: "Translate to English",
    instructions: "Translate the following text to English.",
  },
  {
    emoji: "🇪🇸",
    title: "Translate to Spanish",
    instructions: "Translate the following text to Spanish.",
  },
  {
    emoji: "☯️",
    title: "Simplify",
    instructions:
      "Rewrite the following text in concise, vivid language. Make it as simple as possible without losing meaning.",
  },
];
