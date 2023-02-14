import { ensureNotNull } from "common/assert";

/**
 * Gets the currently selected text on the page. This is much harder than it
 * needs to be, especially if you want to support Google Docs, which completely
 * replaces the native browser selection mechanism.
 */
export function getReplaceableSelection(): ReplaceableSelection | null {
  if (window.location.hostname === "docs.google.com") {
    // Unfortunately the google-docs-utils package doesn't work anymore.
    // It is technically possible to read from Google Docs, but they make it
    // very ugly. Grammarly does it, requires "modify all sites" permissions.
    return null;
  }

  const sel = window.getSelection();
  console.log("Selection", sel);
  if (sel == null || sel.rangeCount !== 1) {
    return null;
  }

  const textarea = getTextAreaOrInput(sel.anchorNode);
  if (textarea != null) {
    return new TextareaInputSelection(textarea);
  } else if (isContentEditable(sel.anchorNode)) {
    return new EditableSelection(sel.getRangeAt(0));
  }
  return null;
}

type TextAreaInput = HTMLTextAreaElement | HTMLInputElement;

function getTextAreaOrInput(node: Node | null): TextAreaInput | null {
  function isTAI(n: Node | null): n is TextAreaInput {
    if (n == null) return false;
    if (n.nodeName === "TEXTAREA") return true;
    return n.nodeName === "INPUT" && (n as HTMLInputElement).type === "text";
  }

  if (node == null) return null;
  if (isTAI(node)) return node;
  const firstChild = (node as HTMLElement).firstElementChild;
  if (isTAI(firstChild)) return firstChild;
  return null;
}

function isContentEditable(node: Node | null): boolean {
  if (node == null) {
    return false;
  }
  const ce = (node as HTMLElement).contentEditable;
  if (ce === "true") {
    return true;
  } else if (ce === "false") {
    return false;
  }
  return isContentEditable(node.parentElement);
}

export interface ReplaceableSelection {
  text: string;
  replace(newText: string): void;
}

/** Selection in an editor that uses contenteditable, like Overleaf. */
class EditableSelection implements ReplaceableSelection {
  text: string;

  constructor(private range: Range) {
    this.text = this.range.toString();
  }

  async replace(newText: string) {
    const { hostname } = window.location;
    if (hostname.endsWith("twitter.com")) {
      console.log(`Using execCommand on ${hostname}`);
      document.execCommand("insertText", false, newText);
      return;
    }

    if (hostname.endsWith("notion.so")) {
      console.log("Special deleteContents()+execCommand() for Notion");
      document.execCommand("insertText", false, newText.split("\n").join(" "));
      return;
    }

    console.log("Attempting replacement via deleteContents()");
    this.range.deleteContents();
    this.range.insertNode(document.createTextNode(newText));
  }
}

/** Selection in a textarea, like Github and many others. */
class TextareaInputSelection implements ReplaceableSelection {
  text: string;
  selStart: number;
  selEnd: number;

  constructor(private textarea: HTMLTextAreaElement | HTMLInputElement) {
    this.selStart = ensureNotNull(this.textarea.selectionStart);
    this.selEnd = ensureNotNull(this.textarea.selectionEnd);
    this.text = this.textarea.value.substring(this.selStart, this.selEnd);
  }

  replace(newText: string) {
    console.log(`Trying execCommand on input or textarea`);
    if (document.execCommand("insertText", false, newText)) {
      return;
    }
    console.log(`Trying setRangeText on input or textarea`);
    this.textarea.setRangeText(newText, this.selStart, this.selEnd, "end");
  }
}
