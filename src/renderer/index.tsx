import * as electron from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";

const AppComponent = () => {
  const [youtubeURL, setYoutubeURL] = React.useState("");
  const [isYoutubeCommenter, setIsYoutubeCommenter] = React.useState(false);

  return (
    <main>
      <h1>live-comment-viewer</h1>
      <hr />
      <h2>Youtube コメビュー</h2>
      <input onChange={e => setYoutubeURL(e.target.value)} placeholder="YoutubeのコメビューのURL" />
      <button onClick={() => electron.ipcRenderer.send("openYoutubeCommentView", youtubeURL)}>開く</button>
      <br />
      音量
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={50}
        onChange={e => electron.ipcRenderer.send("changeYoutubeVolume", Number(e.target.value))}
      />
      <br />
      投稿者名読み上げ
      <input
        type="checkbox"
        onChange={() => {
          electron.ipcRenderer.send("changeIsYoutubeCommenter", Boolean(!isYoutubeCommenter));
          setIsYoutubeCommenter(!isYoutubeCommenter);
        }}
      />
      <hr />
    </main>
  );
};

ReactDOM.render(<AppComponent />, document.getElementById("app"));
