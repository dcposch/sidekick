import { ensure } from "common/assert";
import { Component, h } from "preact";
import { Transform, getTransforms, saveTransforms } from "../common/transform";
import * as browser from "webextension-polyfill";
import { messageToBackground } from "common/messages";

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
        {!isCreating && <button onClick={this.addTransform}>+</button>}
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

    // If necessary, update the selected transform
    const { currentTransform } = await browser.storage.local.get(
      "currentTransform"
    );
    if (
      currentTransform?.emoji === old?.emoji &&
      currentTransform?.title === old?.title
    ) {
      messageToBackground({ type: "selectTransform", transform: newTransform });
    }
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
  description: string;
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
        description: "",
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
            <div>{this.state.title}</div>
            <div>{this.state.description}</div>
          </div>
        </div>
      );
    } else {
      return (
        <div class="transform">
          <div class="cell">
            <input
              type="text"
              value={this.state.emoji}
              placeholder="♡"
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
                value={this.state.title}
                onInput={(e) => {
                  this.setState({
                    title: (e.target as HTMLInputElement).value,
                  });
                }}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Convert selected text to pig latin."
                value={this.state.description}
                onInput={(e) => {
                  this.setState({
                    description: (e.target as HTMLInputElement).value,
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
            <div class="help">
              To change the emoji, try using the emoji keyboard (Cmd+Ctrl+Space
              on Mac).
            </div>
            <button onClick={this.save}>Save</button> &nbsp;{" "}
            <button onClick={this.cancel}>Cancel</button> &nbsp;{" "}
            <button onClick={this.delete}>Delete</button>
            <div class="error">{this.state.errorMessage}</div>
          </div>
        </div>
      );
    }
  }

  edit = () => {
    this.setState({ editing: true });
  };

  save = () => {
    const { emoji, title, description, instructions } = this.state;
    const newT = {
      emoji: emoji.trim(),
      title: title.trim(),
      description: description.trim(),
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
