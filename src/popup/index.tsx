console.log("Hello from the popup");
import classNames from "classnames";
import { messageToBackground } from "common/messages";
import { Transform, getTransforms } from "common/transform";
import { render, h, Component, createRef } from "preact";
import * as browser from "webextension-polyfill";

export interface PopupState {
  missingApiKey?: boolean;
  query: string;
  transforms: Transform[];
  matchingTransforms: Transform[];
  selectedIx: number;
}

class Popup extends Component<{}, PopupState> {
  state: PopupState = {
    query: "",
    transforms: [],
    matchingTransforms: [],
    selectedIx: 0,
  };

  refQueryInput = createRef<HTMLInputElement>();

  render() {
    const { missingApiKey, matchingTransforms, selectedIx } = this.state;
    const firstN = matchingTransforms.slice(0, 8);
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
          {firstN.map((transform, ix) => (
            <div
              key={ix}
              className={classNames("transform", {
                selected: ix === selectedIx,
              })}
              onClick={() => this.selectTransform(transform)}
            >
              <div className="emoji">{transform.emoji}</div>
              <div className="title-desc">
                <div class="title">{transform.title}</div>
                <div class="instructions">{transform.instructions}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="help">
          Use <span class="keyboard-shortcut">Cmd+Shift+E</span> to open
          Sidekick.
        </div>
        <div className={classNames("cta", { error: missingApiKey })}>
          <a href="#" onClick={this.goToOptionsPage}>
            {missingApiKey && "Required - add OpenAI API key"}
            {!missingApiKey && "Add transform"}
          </a>
        </div>
      </div>
    );
  }

  async componentWillMount() {
    const transforms = await getTransforms();
    console.log(`Loaded ${transforms.length} transforms`);
    const { apiKey } = await browser.storage.sync.get("apiKey");
    const missingApiKey = apiKey == null || apiKey === "";
    console.log(`API key ${missingApiKey ? "missing" : "present"}`);
    this.setState({
      missingApiKey,
      transforms,
      matchingTransforms: transforms,
    });
  }

  componentDidMount() {
    this.refQueryInput.current!.focus();
  }

  queryInput = (e: Event) => {
    const query = (e.target as HTMLInputElement).value;
    const { transforms } = this.state;
    const matchingTransforms = transforms.filter((transform) =>
      transform.title.toLowerCase().includes(query.toLowerCase())
    );
    const oldSelTitle =
      this.state.matchingTransforms[this.state.selectedIx]?.title;
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
      await this.selectTransform(matchingTransforms[selectedIx]);
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

  selectTransform = async (transform: Transform) => {
    await messageToBackground({ type: "applyTransform", transform });
    window.close();
  };

  goToOptionsPage = async () => {
    browser.runtime.openOptionsPage();
  };
}

render(<Popup />, document.body);
