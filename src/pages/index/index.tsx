import * as electron from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";

const IndexComponent = () => {
  const savedYoutubeURL = localStorage.getItem("youtubeURL");
  const savedNiconicoURL = localStorage.getItem("niconicoURL");
  const savedTwitchURL = localStorage.getItem("twitchURL");
  const [youtubeURL, setYoutubeURL] = React.useState(savedYoutubeURL || "");
  const [niconicoURL, setNiconicoURL] = React.useState(savedNiconicoURL || "");
  const [twitchURL, setTwitchURL] = React.useState(savedTwitchURL || "");

  const backgroundColors = [
    { name: "透明", value: "rgba(0, 0, 0, 0)" },
    { name: "緑", value: "greenyellow" },
    { name: "青", value: "blue" },
    { name: "白", value: "white" },
  ];
  const [vrmBackgroundColor, setVRMBackgroundColor] = React.useState(backgroundColors[0].value);
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [videoDeviceID, setVideoDeviceID] = React.useState("");

  const [webViewURL, setWebViewURL] = React.useState("");
  const [webViewBackgroundColor, setWebViewBackgroundColor] = React.useState(backgroundColors[0].value);

  React.useEffect(() => {
    (async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(device => device.kind === "videoinput");

      setVideoDevices(videos);
    })();
  });

  return (
    <main>
      <h1>live-comment-viewer</h1>
      <hr />
      <h2>コメビュー</h2>
      <input
        onChange={e => {
          const url = e.target.value;
          setYoutubeURL(url);
          localStorage.setItem("youtubeURL", url);
        }}
        placeholder="YoutubeのコメビューのURL"
        defaultValue={youtubeURL}
      />
      <button onClick={() => electron.ipcRenderer.send("openYoutubeCommentView", youtubeURL)}>開く</button>
      <br />
      <input
        onChange={e => {
          const url = e.target.value;
          setNiconicoURL(url);
          localStorage.setItem("niconicoURL", url);
        }}
        placeholder="ニコニコのコメビューのURL"
        defaultValue={niconicoURL}
      />
      <button onClick={() => electron.ipcRenderer.send("openNiconicoCommentView", niconicoURL)}>開く</button>
      <br />
      <input
        onChange={e => {
          const url = e.target.value;
          setTwitchURL(url);
          localStorage.setItem("twitchURL", url);
        }}
        placeholder="TwitchのコメビューのURL"
        defaultValue={twitchURL}
      />
      <button onClick={() => electron.ipcRenderer.send("openTwitchCommentView", twitchURL)}>開く</button>
      <hr />
      <h2>VRM Viewer</h2>
      <div>
        背景色変更
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setVRMBackgroundColor(e.target.value);
          }}
        >
          {backgroundColors.map(backgroundColor => (
            <option key={backgroundColor.value} value={backgroundColor.value}>
              {backgroundColor.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setVideoDeviceID(e.target.value);
          }}
        >
          {videoDevices.map(videoDevice => (
            <option key={videoDevice.deviceId} value={videoDevice.deviceId}>
              {videoDevice.label}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => electron.ipcRenderer.send("openVRMViewer", { vrmBackgroundColor, videoDeviceID })}
        disabled={!videoDeviceID}
      >
        開く
      </button>
      <hr />
      <h2>URLから開く</h2>
      <input onChange={e => setWebViewURL(e.target.value)} placeholder="WebViewで開きたいURL" />
      <div>
        背景色変更
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setWebViewBackgroundColor(e.target.value);
          }}
        >
          {backgroundColors.map(backgroundColor => (
            <option key={backgroundColor.value} value={backgroundColor.value}>
              {backgroundColor.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() => electron.ipcRenderer.send("openWebViewViewer", { webViewBackgroundColor, webViewURL })}
      >
        開く
      </button>
    </main>
  );
};

ReactDOM.render(<IndexComponent />, document.getElementById("app"));
