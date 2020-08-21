"use strict";

import "./pages/index/index.html";
import "./pages/comment/index.html";
import "./pages/comment/youtube.png";
import "./pages/comment/niconico.png";
import "./pages/comment/twitch.png";
import "./pages/vrm/igarashi.vrm";
import "./pages/vrm/index.html";

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

  await menuWindow.loadURL(`file://${__dirname}/pages/index/index.html`);

  menuWindow.on("closed", () => {
    menuWindow = null;
  });
};

let commentWindow: electron.BrowserWindow | null;
electron.ipcMain.on("addComment", async (_, comment) => {
  if (commentWindow) commentWindow.webContents.send("addComment", comment)
});

const createCommentView = async() => {
  if(!commentWindow) {
    commentWindow = new electron.BrowserWindow({
      x: 300,
      y: 0,
      width: 300,
      height: 900,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });
    await commentWindow.loadURL(`file://${__dirname}/pages/comment/index.html`);
    commentWindow.on("closed", () => {
      commentWindow = null;
    });
  }
};

let youtubeCommentViewWindow: electron.BrowserWindow | null;
electron.ipcMain.on("openYoutubeCommentView", async (_, url) => {
  await createCommentView();

  youtubeCommentViewWindow = new electron.BrowserWindow({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  youtubeCommentViewWindow.loadURL(url);

  youtubeCommentViewWindow.webContents.on("did-finish-load", async () => {
    if (youtubeCommentViewWindow) {
      const executeJavaScript = () => {
        const { ipcRenderer } = window.require("electron");

        const commentElement = document.querySelector(
          "#item-offset",
        ) as HTMLElement;
        new MutationObserver(records => {
          records.forEach(record => {
            Array.from(record.addedNodes).forEach(node => {
              const element = node as any;
              if (!element.querySelector) return;

              const userImageElement = element.querySelector("yt-live-chat-text-message-renderer yt-img-shadow img") as HTMLImageElement;
              const nameElement = element.querySelector("yt-live-chat-author-chip") as HTMLElement;
              const messageElement = element.querySelector("#message") as HTMLElement;

              if (userImageElement && nameElement && messageElement) {
                ipcRenderer.send("addComment", {
                  sndImage: "youtube.png",
                  userImage: userImageElement.src,
                  userName: nameElement.textContent,
                  message: messageElement.textContent
                });
              }
            });
          });
        }).observe(commentElement, {
          attributes: true,
          childList: true,
          subtree: true
        });
      };
      await youtubeCommentViewWindow.webContents.executeJavaScript(
        `
var executeJavaScript = ${executeJavaScript.toString()};
executeJavaScript();`,
        true,
      );
    }
  });

  youtubeCommentViewWindow.on("closed", () => {
    youtubeCommentViewWindow = null;
  });
});

let niconicoCommentViewWindow: electron.BrowserWindow | null;
electron.ipcMain.on("openNiconicoCommentView", async (_, url) => {
  await createCommentView();

  niconicoCommentViewWindow = new electron.BrowserWindow({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  niconicoCommentViewWindow.loadURL(url);

  niconicoCommentViewWindow.webContents.on("did-finish-load", async () => {
    if (niconicoCommentViewWindow) {
      const executeJavaScript = () => {
        const { ipcRenderer } = window.require("electron");

        const commentElement = document.querySelector("div[data-name='comment']") as HTMLElement;
        new MutationObserver(records => {
          records.forEach(record => {
            Array.from(record.addedNodes).forEach(node => {
              const element = node as any;
              if (!element.querySelector) return;

              const messageElement = element.querySelector("span[class*='___comment-text___']") as HTMLElement;

              if (messageElement) {
                ipcRenderer.send("addComment", {
                  sndImage: "niconico.png",
                  userImage: "",
                  userName: "",
                  message: messageElement.textContent
                });
              }
            });
          });
        }).observe(commentElement, {
          attributes: true,
          childList: true,
          subtree: true
        });
      };
      await niconicoCommentViewWindow.webContents.executeJavaScript(
        `
var executeJavaScript = ${executeJavaScript.toString()};
executeJavaScript();`,
        true,
      );
    }
  });

  niconicoCommentViewWindow.on("closed", () => {
    niconicoCommentViewWindow = null;
  });
});

let twitchCommentViewWindow: electron.BrowserWindow | null;
electron.ipcMain.on("openTwitchCommentView", async (_, url) => {
  await createCommentView();

  twitchCommentViewWindow = new electron.BrowserWindow({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  twitchCommentViewWindow.loadURL(url);

  twitchCommentViewWindow.webContents.on("did-finish-load", async () => {
    if (twitchCommentViewWindow) {
      const executeJavaScript = () => {
        const { ipcRenderer } = window.require("electron");

        const commentElement = document.querySelector(".chat-scrollable-area__message-container") as HTMLElement;
        new MutationObserver(records => {
          records.forEach(record => {
            Array.from(record.addedNodes).forEach(node => {
              const element = node as any;
              if (!element.querySelector) return;

              const nameElement = element.querySelector(".chat-line__username") as HTMLElement;
              const messageElement = element.querySelector(".text-fragment") as HTMLElement;

              if (nameElement && messageElement) {
                ipcRenderer.send("addComment", {
                  sndImage: "twitch.png",
                  userImage: "",
                  userName: nameElement.textContent,
                  message: messageElement.textContent
                });
              }
            });
          });
        }).observe(commentElement, {
          attributes: true,
          childList: true,
          subtree: true
        });
      };
      await twitchCommentViewWindow.webContents.executeJavaScript(
        `
var executeJavaScript = ${executeJavaScript.toString()};
executeJavaScript();`,
        true,
      );
    }
  });

  twitchCommentViewWindow.on("closed", () => {
    twitchCommentViewWindow = null;
  });
});

let vrmViewerWindow: electron.BrowserWindow | null;

electron.ipcMain.on(
  "openVRMViewer",
  async (
    _,
    args: {
      vrmBackgroundColor: string;
      videoDeviceID: string;
    },
  ) => {
    vrmViewerWindow = new electron.BrowserWindow({
      width: 320,
      height: 240,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    await vrmViewerWindow.loadURL(
      `file://${__dirname}/pages/vrm/index.html?vrmBackgroundColor=${args.vrmBackgroundColor}&videoDeviceID=${args.videoDeviceID}`,
    );

    vrmViewerWindow.on("closed", () => {
      vrmViewerWindow = null;
    });
  },
);

let webViewViewerWindow: electron.BrowserWindow | null;

electron.ipcMain.on(
  "openWebViewViewer",
  async (
    _,
    args: {
      webViewBackgroundColor: string;
      webViewURL: string;
    },
  ) => {
    webViewViewerWindow = new electron.BrowserWindow({
      width: 600,
      height: 600,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });
  
    webViewViewerWindow.loadURL(args.webViewURL);
  
    webViewViewerWindow.webContents.on("did-finish-load", async () => {
      if (webViewViewerWindow) {
        await webViewViewerWindow.webContents.insertCSS(/*css*/ `
          * {
            color: white !important;
            text-shadow: 0.04em 0.04em 0.04em black;
            background: ${args.webViewBackgroundColor} !important;
          }
        `);
      }
    });
  
    webViewViewerWindow.on("closed", () => {
      webViewViewerWindow = null;
    });
  },
);

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
