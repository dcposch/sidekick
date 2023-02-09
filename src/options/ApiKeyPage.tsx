import classNames from "classnames";
import { Component, h } from "preact";
import * as browser from "webextension-polyfill";

interface ApiKeyPageState {
  apiKey: string | null;
  saveError: boolean;
  saveStatus: string;
}

export class APIKeyPage extends Component<{}, ApiKeyPageState> {
  state: ApiKeyPageState = {
    apiKey: null,
    saveError: false,
    saveStatus: "",
  };

  async componentWillMount() {
    const { apiKey } = await browser.storage.sync.get("apiKey");
    this.setState({ apiKey });
  }

  render() {
    if (this.state.apiKey == null) return null;
    return (
      <form onSubmit={this.submit} className="page-api-key">
        <div class="setting">
          <label>
            OpenAI API Key &nbsp;
            <a
              href="https://platform.openai.com/account/api-keys"
              target="_blank"
            >
              ↗ source
            </a>
          </label>
          <input
            type="text"
            placeholder="sk-"
            value={this.state.apiKey}
            onInput={this.apiKeyInput}
          />
        </div>
        <div>
          <button type="submit">Save</button> &nbsp;
          <span
            id="save-status"
            className={classNames("status", { error: this.state.saveError })}
          >
            {this.state.saveStatus}
          </span>
        </div>
      </form>
    );
  }

  submit = (e: Event) => {
    e.preventDefault();
    this.saveOptions();
  };

  apiKeyInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    this.setState({ apiKey: input.value });
  };

  async saveOptions() {
    if (this.state.apiKey == null) return;

    const apiKey = this.state.apiKey?.trim();
    if (
      apiKey.length > 0 &&
      (!apiKey.startsWith("sk-") || apiKey.length !== 51)
    ) {
      this.setState({ saveStatus: "Invalid API Key", saveError: true });
      return;
    }

    await browser.storage.sync.set({ apiKey });
    this.setState({ saveStatus: "Saved", saveError: false });
  }
}
