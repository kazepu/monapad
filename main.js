const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { getFonts } = require("font-list");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store").default;

const store = new Store();
const watchers = new Map();

let mainWindow;

function createWindow() {
  const windowBounds = store.get("windowBounds") || { width: 800, height: 600 };

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 400,
    minHeight: 210,
    frame: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "favicon.ico"),
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    store.set("windowBounds", { width, height });
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

function createNewWindow() {
  const windowBounds = store.get("windowBounds") || { width: 800, height: 600 };

  const win = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 400,
    minHeight: 210,
    frame: false,
    center: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, "favicon.ico"),
  });

  win.loadFile("index.html");

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("resize", () => {
    const { width, height } = win.getBounds();
    store.set("windowBounds", { width, height });
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
}

// app version
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// File operations, window control handler
ipcMain.handle("window:createNew", createNewWindow);

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
    const watcher = fs.watch(filePath, (eventType) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send("file:changed", { filePath, eventType });
      });
    });
    watchers.set(filePath, watcher);
  } catch (err) {
    console.error("watch error:", err);
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
    await shell.showItemInFolder(path);
  } catch (error) {
    console.error("Failed to open path:", error);
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

ipcMain.on("window:close", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

// print
ipcMain.on("print-content", async (event, { text, fontFamily }) => {
  const escapeHTML = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const html = `
    <html>
      <body>
        <pre style="
            font-family: ${fontFamily};
            white-space: pre-wrap;
            word-wrap: break-word;
            max-width: 100%;
            box-sizing: border-box;
            padding: 1in;
        ">
        ${escapeHTML(text)}
        </pre>
      </body>
    </html>
  `;

  const printWindow = new BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  await printWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`);

  printWindow.webContents.print({ silent: false, printBackground: true }, (success, failureReason) => {
    if (!success) {
      console.error("[main] print failed:", failureReason);
    }
    printWindow.close();
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });
});
