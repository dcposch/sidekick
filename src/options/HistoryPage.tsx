import { TransformSummary } from "content/action";
import { Component, h } from "preact";
import * as browser from "webextension-polyfill";

interface HistoryPageState {
  history: TransformSummary[];
}

export class HistoryPage extends Component<{}, HistoryPageState> {
  state: HistoryPageState = {
    history: [],
  };

  async componentWillMount() {
    let { history } = await browser.storage.local.get("history");
    history = history || [];
    this.setState({ history });
  }

  render() {
    const { history } = this.state;
    return (
      <div class="page-history">
        <div class="history">
          {history.map((t, i) => (
            <pre class="transform" key={i}>
              {`
${t.transform.emoji} ${t.transform.title} using ${t.params.model}
On ${t.domain}
${t.success ? "Succeeded" : "FAILED " + t.status}
Chars ${t.numCharsPrompt} prompt ${t.numCharsCompletion} completion
Took ${t.responseMs.toFixed(0)}ms`}
            </pre>
          ))}
        </div>
      </div>
    );
  }
}
