import { Component, h, render } from "preact";
import * as browser from "webextension-polyfill";
import { APIKeyPage } from "./ApiKeyPage";
import { HistoryPage } from "./HistoryPage";
import { TransformsPage } from "./TransformsPage";

class OptionsUI extends Component {
  state = {
    tab: null as "Settings" | "Transforms" | "History" | null,
  };

  async componentWillMount() {
    const { apiKey } = await browser.storage.sync.get("apiKey");
    const tab = apiKey == null ? "Settings" : "Transforms";
    this.setState({ tab });
  }

  render() {
    return (
      <div>
        <nav>
          {["Settings", "Transforms", "History"].map((tab) => (
            <button
              key={tab}
              disabled={this.state.tab === tab}
              onClick={() => {
                console.log(tab);
                this.setState({ tab });
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
        {this.state.tab === "Settings" && <APIKeyPage />}
        {this.state.tab === "Transforms" && <TransformsPage />}
        {this.state.tab === "History" && <HistoryPage />}
      </div>
    );
  }
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    window.close();
  }
});

render(<OptionsUI />, document.body);
