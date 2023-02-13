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
            <div class="transform" key={i}>
              <div>{t.transform.emoji}</div>
              <div>
                <div>
                  {t.transform.title} using {t.params.model}
                  <br />
                  {t.domain}
                </div>
                <pre>
                  {`
${t.success ? "Succeeded" : "FAILED " + t.status}, took ${t.responseMs | 0}ms
Chars ${t.numCharsPrompt} prompt ${t.numCharsCompletion} completion`.trim()}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
