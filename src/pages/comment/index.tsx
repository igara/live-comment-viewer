import * as electron from "electron";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as style from "./index.css";

type Comment = {
  sndImage: string;
  userImage: string;
  userName: string;
  message: string;
};

let commentVolume = 50;
let isCommenterVoice = false;
let isCommenterDisp = false;
let isNewCommentDisp = false;
let lastComment = "";

const CommentComponent = () => {
  const tableRef = React.useRef<HTMLTableElement>(null);

  electron.ipcRenderer.on("addComment", (_, comment: Comment) => {
    if (tableRef.current) {
      const trElement = document.createElement("tr") as HTMLTableRowElement;

      const snsImageTdElement = document.createElement("td") as HTMLTableDataCellElement;
      snsImageTdElement.setAttribute("class", style.snsImage);
      const snsImageElement = document.createElement("img") as HTMLImageElement;
      snsImageElement.src = comment.sndImage;
      snsImageTdElement.appendChild(snsImageElement);
      trElement.appendChild(snsImageTdElement);

      if (comment.userImage) {
        const userImageTdElement = document.createElement("td") as HTMLTableDataCellElement;
        userImageTdElement.setAttribute("class", style.userImage);
        const userImageElement = document.createElement("img") as HTMLImageElement;
        userImageElement.src = comment.userImage;
        userImageTdElement.appendChild(userImageElement);
        trElement.appendChild(userImageTdElement);
      }

      const userNameTdElement = document.createElement("td") as HTMLTableDataCellElement;
      userNameTdElement.setAttribute("class", style.userName);
      userNameTdElement.innerText = comment.userName;
      trElement.appendChild(userNameTdElement);

      const messageTdElement = document.createElement("td") as HTMLTableDataCellElement;
      messageTdElement.setAttribute("class", style.message);
      messageTdElement.innerText = comment.message;
      trElement.appendChild(messageTdElement);

      tableRef.current.appendChild(trElement);

      if (isNewCommentDisp) {
        const tableElement = document.querySelector(`.${style.tableArea}`);
        if (tableElement) tableElement.scrollTop = tableRef.current.scrollHeight;
      }
    }
  });

  React.useEffect(() => {
    (async () => {
      const voice =
        window.speechSynthesis.getVoices().find(voice => {
          return voice.name === "Google　日本語";
        }) || speechSynthesis.getVoices()[0];
    
      const speak = (voice: SpeechSynthesisVoice, text: string) => {
        const speechSynthesisUtterance = new SpeechSynthesisUtterance();
        speechSynthesisUtterance.voice = voice;
    
        const audio = new SpeechSynthesisUtterance(text);
        audio.volume = commentVolume;
        window.speechSynthesis.speak(audio);
    
        return new Promise(resolve => {
          audio.onend = resolve;
        });
      };
    

      setInterval(async () => {
        const lastCommentElement = document.querySelector(
          "tr:last-child",
        ) as HTMLElement;
        if (!lastCommentElement || !lastCommentElement.textContent) return;

        if (lastComment === lastCommentElement.textContent) return;
        lastComment = lastCommentElement.textContent;

        const userNameElement = lastCommentElement.querySelector(`.${style.userName}`) as HTMLElement;
        const messageElement = lastCommentElement.querySelector(`.${style.message}`) as HTMLElement;

        if (!messageElement.textContent) return;

        if (isCommenterVoice && userNameElement.textContent) {
          await speak(voice, `${userNameElement.textContent}さんコメント  ${messageElement.textContent}`);
        } else {
          await speak(voice, messageElement.textContent);
        }
      }, 5000);
    })();
  });

  return (
    <main className={style.main}>
      <div className={style.setting}>
        <div>
          <span>音量</span>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={50}
            onChange={e => {
              let volume = Number(e.target.value);

              if (volume == 0) {
                commentVolume = volume;
              } else {
                commentVolume = volume / 100;
              }
            }}
          />
        </div>
        <div>
          <span>投稿者名読み上げ</span>
          <input
            type="checkbox"
            onChange={() => {
              isCommenterVoice = !isCommenterVoice;
            }}
          />
        </div>
        <div>
          <span>投稿者名表示</span>
          <input
            type="checkbox"
            onChange={() => {
              isCommenterDisp = !isCommenterDisp;
              if (tableRef.current) tableRef.current.setAttribute("class", `${style.table} ${isCommenterDisp ? style.displyUserName : style.hiddenUserName}`);
            }}
          />
        </div>
        <div>
          <span>新しいコメントを追う</span>
          <input
            type="checkbox"
            onChange={() => isNewCommentDisp = !isNewCommentDisp}
          />
        </div>
      </div>
      <div className={style.tableArea}>
        <table ref={tableRef} className={`${style.table} ${isCommenterDisp ? style.displyUserName : style.hiddenUserName}`} />
      </div>
    </main>
  );
};

ReactDOM.render(<CommentComponent />, document.getElementById("app"));
