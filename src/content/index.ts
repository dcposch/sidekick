import { dispatch } from "./action";

// Poor man's React. Update state, then render DOM based on state.
// No vdom, no diff. Very light. We still separate logic from presentation.
// This entry point runs when we inject the content script, which happens the
// first time the user triggers the extension.
dispatch({ type: "tryTransform" });
