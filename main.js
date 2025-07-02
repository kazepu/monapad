const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getFonts } = require("font-list");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store").default;
const log = require("electron-log");
const logDir = path.dirname(log.transports.file.getFile().path);

const store = new Store();
const watchers = new Map();
const watchedCssFiles = new Map();
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;
let filePathToOpen = null;

fs.readdirSync(logDir).forEach((file) => {
  if (file.startsWith("main.log.old")) {
    const filePath = path.join(logDir, file);
    fs.unlinkSync(filePath);
    console.log(`[LOG CLEANUP] Deleted old log file: ${file}`);
  }
});

function createWindow() {
  const windowBounds = store.get("windowBounds") || { width: 800, height: 600 };

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 400,
    minHeight: 210,
    backgroundColor: "#000000",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "icon/favicon.ico"),
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("focus", () => {
    mainWindow.webContents.send("window-focus", true);
  });

  mainWindow.on("blur", () => {
    mainWindow.webContents.send("window-focus", false);
  });

  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    store.set("windowBounds", { width, height });
  });

  mainWindow.on("close", (e) => {
    if (mainWindow.webContents.isDestroyed()) return;
    e.preventDefault();
    mainWindow.webContents.send("attempt-close-window");
  });

  // open link with default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const currentURL = mainWindow.webContents.getURL();
    if (url !== currentURL) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createNewWindow(parentWindow) {
  const windowBounds = store.get("windowBounds") || { width: 800, height: 600 };

  let x, y;
  if (parentWindow) {
    const parentBounds = parentWindow.getBounds();
    x = parentBounds.x + 30;
    y = parentBounds.y + 30;
  }

  const win = new BrowserWindow({
    x,
    y,
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 400,
    minHeight: 210,
    backgroundColor: "#000000",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "icon/favicon.ico"),
  });

  win.loadFile("index.html");

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("focus", () => {
    win.webContents.send("window-focus", true);
  });

  win.on("blur", () => {
    win.webContents.send("window-focus", false);
  });

  win.on("resize", () => {
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
  });

  win.on("close", (e) => {
    if (win.webContents.isDestroyed()) return;
    e.preventDefault();
    win.webContents.send("attempt-close-window");
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const currentURL = win.webContents.getURL();
    if (url !== currentURL) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  return win;
}

function createNewWindowWithTab(parentWindow, tabData) {
  const newWindow = createNewWindow(parentWindow);

  // send tab data when new window is ready
  newWindow.webContents.once("did-finish-load", () => {
    newWindow.webContents.send("load-tab-data", tabData);
  });
}

// app version
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// theme folder
ipcMain.handle("get-custom-themes", async () => {
  try {
    const userThemesDir = path.join(app.getPath("userData"), "themes");

    const themesMap = new Map();

    if (fs.existsSync(userThemesDir)) {
      const files = fs.readdirSync(userThemesDir);
      for (const file of files) {
        if (file.endsWith(".css")) {
          const themeName = file.replace(/\.css$/, "");
          const fullPath = path.join(userThemesDir, file);
          themesMap.set(themeName, fullPath);
        }
      }
    }

    return Object.fromEntries(themesMap);
  } catch {
    return {};
  }
});

ipcMain.handle("get-user-data-path", () => {
  return app.getPath("userData");
});

ipcMain.handle("read-css-file", async (event, filePath) => {
  try {
    const cssContent = fs.readFileSync(filePath, "utf8");
    return cssContent;
  } catch (error) {
    console.error("Failed to read CSS file:", error);
    return null;
  }
});

ipcMain.on("watch-css-file", (event, filePath) => {
  if (watchedCssFiles.has(filePath)) return;

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      event.sender.send("css-file-updated", filePath);
    }
  });

  watchedCssFiles.set(filePath, watcher);
});

ipcMain.on("unwatch-css-file", (event, filePath) => {
  const watcher = watchedCssFiles.get(filePath);
  if (watcher) {
    watcher.close();
    watchedCssFiles.delete(filePath);
  }
});

// File operations, window control handler
ipcMain.handle("window:createNew", (event) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  createNewWindow(parentWindow);
});

ipcMain.handle("window:createNewWithTab", (event, tabData) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  createNewWindowWithTab(parentWindow, tabData);
});

ipcMain.handle("dialog:openFile", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
  return canceled ? null : filePaths[0];
});

ipcMain.handle("dialog:saveFile", async (event, defaultName) => {
  const { canceled, filePath } = await dialog.showSaveDialog({ defaultPath: defaultName });
  return canceled || !filePath ? {} : { filePath };
});

ipcMain.handle("file:save", async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, "utf8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("file:read", async (event, filePath) => {
  try {
    return await fs.promises.readFile(filePath, "utf8");
  } catch {
    return null;
  }
});

ipcMain.handle("file:exists", async (event, filePath) => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("file:watch", (event, filePath) => {
  if (watchers.has(filePath)) return;
  try {
    const watcher = fs.watch(filePath, async (eventType) => {
      if (eventType === "rename") {
        // for app that deletes original file and use temporary file to apply change
        setTimeout(() => {
          fs.promises
            .access(filePath, fs.constants.F_OK)
            .then(() => {
              BrowserWindow.getAllWindows().forEach((win) => {
                win.webContents.send("file:changed", { filePath, eventType: "change" });
              });
            })
            .catch(() => {
              BrowserWindow.getAllWindows().forEach((win) => {
                win.webContents.send("file:changed", { filePath, eventType: "rename" });
              });
            });
        }, 100);
      } else {
        BrowserWindow.getAllWindows().forEach((win) => {
          win.webContents.send("file:changed", { filePath, eventType });
        });
      }
    });
    watchers.set(filePath, watcher);
  } catch (err) {
    log.error("watch error:", err);
  }
});

ipcMain.handle("file:unwatch", (event, filePath) => {
  const watcher = watchers.get(filePath);
  if (watcher) {
    watcher.close();
    watchers.delete(filePath);
  }
});

ipcMain.handle("open-path", async (event, path) => {
  try {
    const stats = fs.statSync(path);
    if (stats.isDirectory()) {
      // open inside folder if folder path
      await shell.openPath(path);
    } else {
      // open parent folder if file path
      await shell.showItemInFolder(path);
    }
  } catch (error) {
    log.error("Failed to open path:", error);
  }
});

// font
ipcMain.handle("get-fonts", async () => {
  try {
    const fonts = await getFonts();
    return fonts;
  } catch (err) {
    return [];
  }
});

// window controls
ipcMain.on("window:minimize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

ipcMain.on("window:toggleMaximize", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window) {
    window.isMaximized() ? window.unmaximize() : window.maximize();
  }
});

// call window close from toolbar button
ipcMain.on("window:close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.destroy();
});

// print
// ipcMain.on("print-content", async (event, { text, fontFamily }) => {
//   const escapeHTML = (str) =>
//     str
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#39;");

//   const html = `
//     <html>
//       <body>
//         <pre style="
//             font-family: ${fontFamily};
//             white-space: pre-wrap;
//             word-wrap: break-word;
//             max-width: 100%;
//             box-sizing: border-box;
//             padding: 1in;
//         ">
//         ${escapeHTML(text)}
//         </pre>
//       </body>
//     </html>
//   `;

//   const printWindow = new BrowserWindow({
//     show: true,
//     transparent: false,
//     frame: false,
//     webPreferences: { nodeIntegration: true, contextIsolation: false },
//   });

//   await printWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`);

//   printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
//     if (!success) {
//       log.error("[main] print failed:", failureReason);
//     }
//     printWindow.close();
//   });
// });

function getFilePathFromArgv(argv) {
  log.info("Debug: process.argv =", argv);

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    log.info(`Debug: checking arg[${i}] =`, arg);

    // - not parameter
    // - doesn't end with .exe nor .app
    // - path exists
    // - has extension
    if (
      arg &&
      !arg.startsWith("--") &&
      !arg.endsWith(".exe") &&
      !arg.endsWith(".app") &&
      fs.existsSync(arg) &&
      path.extname(arg)
    ) {
      log.info("Debug: Found valid file path:", arg);
      return path.resolve(arg);
    }
  }

  log.info("Debug: No valid file path found");
  return null;
}

// Handle file association
if (!gotTheLock) {
  app.quit();
} else {
  // Handle second instance (when file is double-clicked while app is running)
  app.on("second-instance", (event, argv, workingDirectory) => {
    log.info("Debug: second-instance triggered with argv:", argv);

    const filePath = getFilePathFromArgv(argv);
    if (filePath) {
      log.info("Debug: Opening file in existing instance:", filePath);

      // Focus existing window
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const win = windows[0];
        if (win.isMinimized()) win.restore();
        win.focus();
        win.webContents.send("open-file", filePath);
      }
    } else {
      // No file to open, just focus the window
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const win = windows[0];
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    }
  });

  app.whenReady().then(() => {
    // create theme folder if not exist
    const userThemesPath = path.join(app.getPath("userData"), "themes");
    if (!fs.existsSync(userThemesPath)) {
      fs.mkdirSync(userThemesPath, { recursive: true });
      console.log("[INIT] Created themes folder:", userThemesPath);
    }

    createWindow();

    // Handle file opened on app start
    filePathToOpen = getFilePathFromArgv(process.argv);

    mainWindow.webContents.once("did-finish-load", () => {
      if (filePathToOpen) {
        log.info("Sending open-file event to renderer");
        mainWindow.webContents.send("open-file", filePathToOpen);
        filePathToOpen = null;
      }
    });

    // Updater
    if (autoUpdater) {
      autoUpdater.checkForUpdatesAndNotify();

      autoUpdater.on("update-downloaded", async () => {
        const { response } = await dialog.showMessageBox(mainWindow, {
          type: "info",
          buttons: ["Restart now", "Later"],
          defaultId: 0,
          cancelId: 1,
          title: "Update Ready",
          message: "A new version has been downloaded. Restart the app now to apply the update?",
        });
        if (response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });

  // Handle macOS file opening
  app.on("open-file", (event, path) => {
    event.preventDefault();
    log.info("Debug: macOS open-file event triggered with path:", path);

    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send("open-file", path);
    } else {
      // If no windows exist, store the file path and open it after window creation
      app.whenReady().then(() => {
        createWindow();
        mainWindow.webContents.once("did-finish-load", () => {
          mainWindow.webContents.send("open-file", path);
        });
      });
    }
  });
}
