console.log("Hello from the popup");
import classNames from "classnames";
import { messageToBackground } from "common/messages";
import { Transform, getTransforms } from "common/transform";
import { render, h, Component, createRef } from "preact";

export interface PopupState {
  apiKey?: string;
  query: string;
  transforms: Transform[];
  matchingTransforms: Transform[];
  selectedIx: number;
}

class Popup extends Component {
  state: PopupState = {
    query: "",
    transforms: [],
    matchingTransforms: [],
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
              key={ix}
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

  async componentWillMount() {
    const transforms = await getTransforms();
    console.log(`Loaded ${transforms.length} transforms`);
    this.setState({ transforms, matchingTransforms: transforms });
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
