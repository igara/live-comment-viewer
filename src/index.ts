/* eslint-disable no-inner-declarations */
"use strict";

import "./index.html";

import * as electron from "electron";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let menuWindow: electron.BrowserWindow | null;

// Scheme must be registered before the app is ready
electron.protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

const createMenuWindow = async () => {
  // Create the browser window.
  menuWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  menuWindow.loadURL(`file://${__dirname}/index.html`);

  menuWindow.on("closed", () => {
    menuWindow = null;
  });
};

electron.ipcMain.on("openYoutubeCommentView", async (_, url) => {
  const youtubeCommentViewWindow = new electron.BrowserWindow({
    width: 300,
    height: 900,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  youtubeCommentViewWindow.loadURL(url);

  youtubeCommentViewWindow.webContents.on("did-finish-load", async () => {
    if (youtubeCommentViewWindow) {
      await youtubeCommentViewWindow.webContents.insertCSS(/*css*/ `
        * {
          color: white !important;
          text-shadow: 0.02em 0.02em 0.02em rgba(0,0,0,1);
          background: rgba(0, 0, 0, 0) !important;
        }
      `);

      function executeJavaScript() {
        const voice =
          window.speechSynthesis.getVoices().find(voice => {
            return voice.name === "Google　日本語";
          }) || speechSynthesis.getVoices()[0];

        const speak = (voice: SpeechSynthesisVoice, text: string) => {
          const speechSynthesisUtterance = new SpeechSynthesisUtterance();
          speechSynthesisUtterance.voice = voice;

          const audio = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(audio);

          return new Promise(resolve => {
            audio.onend = resolve;
          });
        };

        let lastComment = "";

        setInterval(async () => {
          const lastCommentElement = document.querySelector(
            "yt-live-chat-text-message-renderer:last-child",
          ) as HTMLElement;
          if (!lastCommentElement || !lastCommentElement.textContent) return;

          if (lastComment === lastCommentElement.textContent) return;
          lastComment = lastCommentElement.textContent;

          const nameElement = lastCommentElement.querySelector("yt-live-chat-author-chip") as HTMLElement;
          const messageElement = lastCommentElement.querySelector("#message") as HTMLElement;

          if (!nameElement.textContent) return;
          if (!messageElement.textContent) return;
          await speak(voice, `${nameElement.textContent}さんコメント  ${messageElement.textContent}`);
        }, 1000);
      }
      await youtubeCommentViewWindow.webContents.executeJavaScript(
        `var executeJavaScript = ${executeJavaScript.toString()};executeJavaScript();`,
        true,
      );
    }
  });

  youtubeCommentViewWindow.on("closed", () => {
    menuWindow = null;
  });
});

// Quit when all windows are closed.
electron.app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});

electron.app.on("activate", async () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (menuWindow === null) {
    await createMenuWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on("ready", async () => {
  await createMenuWindow();

  // await createSlackBrowser();
  // await createDiscordBrowser();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", data => {
      if (data === "graceful-exit") {
        electron.app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      electron.app.quit();
    });
  }
}
