import * as electron from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";

const AppComponent = () => {
  const [youtubeURL, setYoutubeURL] = React.useState("");

  return (
    <main>
      <h1>live-comment-viewer</h1>
      <hr />
      <h2>Youtube コメビュー</h2>
      <input onChange={e => setYoutubeURL(e.target.value)} placeholder="YoutubeのコメビューのURL" />
      <button onClick={() => electron.ipcRenderer.send("openYoutubeCommentView", youtubeURL)}>開く</button>
    </main>
  );
};

ReactDOM.render(<AppComponent />, document.getElementById("app"));
