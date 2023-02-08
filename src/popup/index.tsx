console.log("Hello from the popup");
import classNames from "classnames";
import { messageToBackground } from "common/messages";
import { Transform } from "common/transform";
import { render, h, Component, createRef } from "preact";
import { PopupState } from "./state";

const DEFAULT_TRANSFORMS: Transform[] = [
  {
    emoji: "♾\uFE0F",
    title: "Create LaTeX",
    description: "Convert selected instructions to LaTeX.",
    instructions:
      "Convert instructions to LaTeX. Include an equation environment if necessary.",
  },
  {
    emoji: "✍️\uFE0F",
    title: "Create Markdown",
    description: "Convert selected instructions to Markdown.",
    instructions: "Convert instructions to Markdown. Use a table if necessary.",
  },
  {
    emoji: "🇺🇸",
    title: "Translate to English",
    description: "Translate selected text to English.",
    instructions: "Translate the following text to English.",
  },
  {
    emoji: "🇪🇸",
    title: "Translate to Spanish",
    description: "Translate selected text to Spanish.",
    instructions: "Translate the following text to Spanish.",
  },
  {
    emoji: "☯️",
    title: "Simplify",
    description: "Make selected text more concise.",
    instructions:
      "Rewrite the following text in concise, vivid language. Make it as simple as possible without losing meaning.",
  },
];

class Popup extends Component {
  state: PopupState = {
    query: "",
    matchingTransforms: DEFAULT_TRANSFORMS.slice(),
    selectedIx: 0,
  };

  refQueryInput = createRef<HTMLInputElement>();

  render() {
    const { matchingTransforms, selectedIx } = this.state;
    return (
      <div className="popup">
        <input
          ref={this.refQueryInput}
          onKeyDown={this.keyDown}
          value={this.state.query}
          onInput={this.queryInput}
          className="query-input"
        ></input>
        <div className="transform-list">
          {matchingTransforms.map((transform, ix) => (
            <div
              className={classNames("transform", {
                selected: ix === selectedIx,
              })}
            >
              <div className="emoji">{transform.emoji}</div>
              <div className="title-desc">
                <div>
                  <strong>{transform.title}</strong>
                </div>
                <div>{transform.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.refQueryInput.current!.focus();
  }

  queryInput = (e: Event) => {
    const query = (e.target as HTMLInputElement).value;
    const matchingTransforms = DEFAULT_TRANSFORMS.filter((transform) =>
      transform.title.toLowerCase().includes(query.toLowerCase())
    );
    const oldSelTitle =
      this.state.matchingTransforms[this.state.selectedIx].title;
    const selectedIx = Math.max(
      0,
      matchingTransforms.findIndex(
        (transform) => transform.title === oldSelTitle
      )
    );
    this.setState({ query, matchingTransforms, selectedIx });
  };

  keyDown = async (e: KeyboardEvent) => {
    const { matchingTransforms, selectedIx } = this.state;

    if (e.key === "Enter") {
      await messageToBackground({
        type: "selectTransform",
        transform: matchingTransforms[selectedIx],
      });
      window.close();
    } else if (e.key === "ArrowUp") {
      // Up key
      this.setState({
        selectedIx: Math.max(0, selectedIx - 1),
      });
    } else if (e.key === "ArrowDown") {
      this.setState({
        selectedIx: Math.min(matchingTransforms.length - 1, selectedIx + 1),
      });
    } else if (e.key === "Escape") {
      window.close();
    }
  };
}

render(<Popup />, document.body);
