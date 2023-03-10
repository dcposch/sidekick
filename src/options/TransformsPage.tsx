import { ensure } from "common/assert";
import { Component, createRef, h } from "preact";
import { getTransforms, saveTransforms, Transform } from "../common/transform";

interface TransformsPageState {
  transforms: Transform[];
  isCreating: boolean;
}

export class TransformsPage extends Component<{}, TransformsPageState> {
  state: TransformsPageState = {
    transforms: [],
    isCreating: false,
  };

  async componentWillMount() {
    const transforms = await getTransforms();
    this.setState({ transforms });
  }

  render() {
    const { transforms, isCreating } = this.state;
    return (
      <div class="page-transforms">
        {!isCreating && (
          <div className="add-transform-row">
            <button onClick={this.addTransform}>Add transform</button>
          </div>
        )}
        {isCreating && <TransformRow save={this.save} cancel={this.cancel} />}
        <div class="transforms">
          {transforms.map((transform) => (
            <TransformRow
              key={transform.emoji + transform.title}
              transform={transform}
              save={this.save}
            />
          ))}
        </div>
      </div>
    );
  }

  addTransform = () => {
    this.setState({ isCreating: true });
  };

  cancel = () => {
    this.setState({ isCreating: false });
  };

  save = async (newTransform?: Transform, old?: Transform) => {
    const transforms = this.state.transforms.slice();
    if (old == null) {
      // Create
      ensure(newTransform != null);
      transforms.unshift(newTransform);
    } else if (newTransform == null) {
      // Delete
      ensure(old != null);
      const i = transforms.indexOf(old);
      ensure(i >= 0);
      transforms.splice(i, 1);
    } else {
      // Edit
      const i = transforms.indexOf(old);
      ensure(i >= 0);
      transforms[i] = newTransform;
    }

    // Save the new and improved list of transforms
    saveTransforms(transforms);
    this.setState({ transforms, isCreating: false });
  };
}

interface TRowProps {
  transform?: Transform;
  save: (newTransform?: Transform, old?: Transform) => void;
  cancel?: () => void;
}

interface TRowState {
  errorMessage?: string;
  editing: boolean;
  emoji: string;
  title: string;
  instructions: string;
}

class TransformRow extends Component<TRowProps, TRowState> {
  constructor(props: TRowProps) {
    super(props);
    if (props.transform == null) {
      this.state = {
        editing: true,
        emoji: "",
        title: "",
        instructions: "",
      };
    } else {
      this.state = { editing: false, ...props.transform };
    }
  }

  render() {
    if (!this.state.editing) {
      return (
        <div class="transform editable" onClick={this.edit}>
          <div class="emoji">{this.state.emoji}</div>
          <div class="title-desc">
            <div class="title">{this.state.title}</div>
            <div class="instructions">{this.state.instructions}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          class="transform"
          onKeyDown={this.keyDown}
          onKeyPress={this.keyDown}
        >
          <div class="cell">
            <input
              type="text"
              value={this.state.emoji}
              placeholder="???"
              onInput={(e) => {
                this.setState({ emoji: (e.target as HTMLInputElement).value });
              }}
            />
          </div>
          <div class="cell">
            <div>
              <input
                type="text"
                placeholder="Pig Latin"
                ref={this.focus}
                value={this.state.title}
                onInput={(e) => {
                  this.setState({
                    title: (e.target as HTMLInputElement).value,
                  });
                }}
              />
            </div>
            <textarea
              placeholder={"Convert the following text to pig latin."}
              rows={4}
              value={this.state.instructions}
              onInput={(e) => {
                this.setState({
                  instructions: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
            <EmojiHelp />
            <button onClick={this.save}>Save</button> &nbsp;{" "}
            <button onClick={this.cancel}>Cancel</button> &nbsp;{" "}
            <button onClick={this.delete}>Delete</button>
            <div class="error">{this.state.errorMessage}</div>
          </div>
        </div>
      );
    }
  }

  inputTitle: HTMLInputElement | null = null;
  focus = (e: HTMLInputElement | null) => {
    console.log(e);
    this.inputTitle = e;
    if (e != null) e.focus();
  };

  componentDidMount(): void {
    // Not clear why this is necessary, but it is. Runs on Add Transform.
    if (this.inputTitle != null) this.inputTitle.focus();
  }

  keyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.state.editing) {
      console.log("Escaping edit");
      e.stopPropagation();
      this.cancel();
    }
  };

  edit = () => {
    this.setState({ editing: true });
  };

  save = () => {
    const { emoji, title, instructions } = this.state;
    const newT = {
      emoji: emoji.trim(),
      title: title.trim(),
      instructions: instructions.trim(),
    };
    if (newT.emoji === "") return this.err("Missing emoji");
    if (newT.emoji.length > 4) return this.err("Not an emoji");
    if (newT.title === "") return this.err("Missing title");
    if (newT.title.length > 64) return this.err("Title too long");
    if (newT.instructions === "") return this.err("Missing instructions");
    if (newT.instructions.length > 2000)
      return this.err("Instructions too long");

    console.log("Saving transform", newT);
    this.props.save(newT, this.props.transform);
    this.setState({ editing: false, errorMessage: undefined });
    return 0;
  };

  err(errorMessage: string) {
    this.setState({ errorMessage });
    return 0;
  }

  cancel = () => {
    this.props.cancel && this.props.cancel();
    this.setState({
      editing: false,
      errorMessage: undefined,
      ...this.props.transform,
    });
  };

  delete = () => {
    this.props.save(undefined, this.props.transform);
    this.setState({ editing: false, errorMessage: undefined });
  };
}

function EmojiHelp() {
  let shortcut = "Ctrl+Cmd+Space";
  if (navigator.userAgent.includes("Mac")) {
    shortcut = "Ctrl+Cmd+Space";
  } else if (navigator.userAgent.includes("Windows")) {
    shortcut = "Win+.";
  } else {
    shortcut = "Ctrl+.";
  }
  return (
    <div class="help">
      To change the emoji, try the emoji keyboard:{" "}
      <span className="keyboard-shortcut">{shortcut}</span>
    </div>
  );
}
