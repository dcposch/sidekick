/** Gets the currently selected text on the page.
 * This is much harder than it needs to be, especially if you want to support Google Docs, which completely replaces the native browser selection mechanism. */
export function getReplaceableSelection(): ReplaceableSelection | null {
  const sel = window.getSelection();
  console.log("Selection", sel);
  if (sel == null || sel.rangeCount !== 1) {
    return null;
  }

  const textarea = getTextArea(sel.anchorNode);
  if (textarea != null) {
    return new TextareaSelection(textarea);
  } else if (isContentEditable(sel.anchorNode)) {
    return new EditableSelection(sel.getRangeAt(0));
  }
  return null;
}

function getTextArea(node: Node | null): HTMLTextAreaElement | null {
  if (node == null) {
    return null;
  } else if (node.nodeName === "TEXTAREA") {
    return node as HTMLTextAreaElement;
  } else if ((node as HTMLElement).firstElementChild?.nodeName === "TEXTAREA") {
    return (node as HTMLElement).firstElementChild as HTMLTextAreaElement;
  }
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

  replace(newText: string) {
    this.range.deleteContents();
    this.range.insertNode(document.createTextNode(newText));
  }
}

/** Selection in a textarea, like Github and many others. */
class TextareaSelection implements ReplaceableSelection {
  text: string;

  constructor(private textarea: HTMLTextAreaElement) {
    this.text = this.textarea.value.substring(
      this.textarea.selectionStart,
      this.textarea.selectionEnd
    );
  }

  replace(newText: string) {
    this.textarea.setRangeText(
      newText,
      this.textarea.selectionStart,
      this.textarea.selectionEnd,
      "end"
    );
  }
}
