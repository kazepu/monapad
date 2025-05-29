import * as monaco from "monaco-editor";

const tabs = document.getElementById("tabs");
const editor = document.getElementById("editor");
const addTabButton = document.getElementById("add-tab");
const menuButton = document.getElementById("menu-button");
const menu = document.getElementById("menu");
const changeThemeBtn = document.getElementById("changeTheme");
const themeMenu = document.getElementById("theme-menu");
const openRecentBtn = document.getElementById("openRecent");
const recentMenu = document.getElementById("recent-menu");
const themeButtons = themeMenu.querySelectorAll("button");
const newWindowBtn = document.getElementById("newWindowBtn");
const newTabBtn = document.getElementById("newTabBtn");
const fontSizeValue = document.getElementById("font-size-value");
const sizeDecrease = document.getElementById("size-decrease");
const sizeIncrease = document.getElementById("size-increase");
const fontFamilySelect = document.getElementById("font-family-select");
const fontStyleSelect = document.getElementById("font-style-select");
const fontLayoutButton = document.getElementById("font-layout");
const fontLayoutMenu = document.getElementById("font-layout-menu");
const customContextMenu = document.getElementById("custom-context-menu");
const tabContextMenu = document.getElementById("tab-context-menu");
const excludedIds = ["changeTheme", "openRecent"]; // buttons that dont close menu on click

const STORAGE_KEY = "monacoFontSizePersistent";
let persistentFontSize = Number(localStorage.getItem(STORAGE_KEY)) || 16;
let fontSize = persistentFontSize;
let draggingTab = null;
let dragStartX = 0;
let originalX = 0;
let startX = 0;
let currentX = 0;
let dragIndex = -1;
let zoomLevel = 1;
let currentTab = { content: "", selection: null, fontSize: persistentFontSize };
let tabData = [];
let statusBarVisible = localStorage.getItem("statusBarVisible") !== "false";
let currentTheme = localStorage.getItem("theme") || "dark";
let currentFilePath = "Untitled.txt";
const defaultSettings = { lineHighlight: true, lineNumbers: false };
const settings = JSON.parse(localStorage.getItem("editorSettings")) || defaultSettings;
let selectedFontFamily = localStorage.getItem("selectedFontFamily") || "Figtree";
let monacoEditor = null;

// editor context menu
let isWordWrapOn = true;
let isMarkdownOn = false;

// store right clicked tab
let rightClickedTab = null;

// watch only active tab, remove old watcher when tab switched (switchTab)
let currentWatcher = null;

// app version
window.electronAPI.getAppVersion().then((version) => {
  document.querySelector("#version-text").textContent = `v${version}`;
});

// get css variable
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

monaco.editor.defineTheme("custom-theme", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": getCSSVar("--color1"),
    "editor.foreground": "#ffffff",
  },
  insertSpaces: false,
});

monacoEditor = monaco.editor.create(editor, {
  language: "plaintext",
  wordWrap: "on",
  minimap: { enabled: false },
  fontSize: persistentFontSize,
  renderLineHighlight: settings.lineHighlight ? "line" : "none",
  lineNumbers: settings.lineNumbers ? "on" : "off",
  folding: false,
  lineNumbersMinChars: settings.lineNumbers ? 5 : 2,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: editor.clientHeight / 2 },
  occurrencesHighlight: false,
  stickyScroll: { enabled: false },
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  wordBasedSuggestions: false,
  matchBrackets: "never",
  fontFamily: `"${selectedFontFamily}", "Meiryo", "Noto Sans JP", "Segoe UI", "sans-serif"`,
  unicodeHighlight: {
    nonBasicASCII: false,
    ambiguousCharacters: false,
    invisibleCharacters: false,
  },
  autoClosingBrackets: false,
  contextmenu: false,
  renderIndentGuides: false,
  insertSpaces: false,
  tabSize: 8,
  find: {
    addExtraSpaceOnTop: false,
  },
});

// # and -#
let currentDecorations = [];

function applyDecorations() {
  const model = monacoEditor.getModel();
  if (!model) return;

  const fullText = model.getValue();
  const lines = fullText.split("\n");

  const decorations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("-# ")) {
      decorations.push({
        range: new monaco.Range(i + 1, 1, i + 1, line.length + 1),
        options: { inlineClassName: "gray-text" },
      });
    } else if (line.startsWith("# ")) {
      decorations.push({
        range: new monaco.Range(i + 1, 1, i + 1, line.length + 1),
        options: { inlineClassName: "heading" },
      });
    }
  }

  currentDecorations = monacoEditor.deltaDecorations(currentDecorations, decorations);
}

// detect change in editor
monacoEditor.onDidChangeModelContent(() => {
  const active = tabData.find((t) => t.element.classList.contains("active"));
  if (!active) return;

  const currentContent = monacoEditor.getValue();
  active.content = currentContent;

  if (active._ignoreUnsavedCheck) {
    active._ignoreUnsavedCheck = false;
    return;
  }

  const hasUnsavedChanges = currentContent.trim() !== (active.originalContent || "").trim();
  active.unsavedIndicator = !hasUnsavedChanges;

  // display unsaved dot
  const close = active.element.querySelector(".close");
  const nameSpan = active.element.querySelector(".name");
  if (close) {
    if (hasUnsavedChanges) {
      close.classList.add("show-unsaved");
    } else {
      close.classList.remove("show-unsaved");
    }
    nameSpan.style.maxWidth = "calc(100% - 15px)";
  }

  updateStatusBar();
  applyDecorations();
});
applyDecorations();

// font family
const fontMap = new Map();
const defaultFonts = ["Meiryo", "sans-serif", "monospace", "Consolas", "Courier New"];

// get font using font-list and apply on launch
window.electronAPI.getFonts().then((fonts) => {
  const cleanedFonts = fonts.map((f) => f.trim().replace(/^"|"$/g, ""));
  const allFontsSet = new Set([...cleanedFonts, ...defaultFonts]);
  const allFonts = Array.from(allFontsSet).sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  allFonts.forEach((fontName) => {
    const option = document.createElement("option");
    option.value = fontName;
    option.textContent = fontName;
    option.style.fontFamily = `"${fontName}", sans-serif`;
    fontFamilySelect.appendChild(option);
  });

  fontFamilySelect.value = selectedFontFamily;
  applyFontToMonaco();
});

// apply font on change
fontFamilySelect.addEventListener("change", () => {
  selectedFontFamily = fontFamilySelect.value;
  localStorage.setItem("selectedFontFamily", selectedFontFamily);
  console.log(selectedFontFamily);
  applyFontToMonaco();
});
function applyFontToMonaco() {
  let cleanFontFamily = selectedFontFamily;
  if (cleanFontFamily.startsWith('"') && cleanFontFamily.endsWith('"')) {
    cleanFontFamily = cleanFontFamily.slice(1, -1);
  }
  monacoEditor.updateOptions({
    fontFamily: `${cleanFontFamily}, "Meiryo", "Noto Sans JP", "Segoe UI", "sans-serif"`,
  });
}

// layout
function applySettings() {
  monacoEditor.updateOptions({
    renderLineHighlight: settings.lineHighlight ? "line" : "none",
    lineNumbers: settings.lineNumbers ? "on" : "off",
  });
  document.querySelector("#line-highlight .checkmark").style.display = settings.lineHighlight ? "inline" : "none";
  document.querySelector("#line-num .checkmark").style.display = settings.lineNumbers ? "inline-block" : "none";
}

function toggleSetting(key) {
  settings[key] = !settings[key];
  localStorage.setItem("editorSettings", JSON.stringify(settings));
  applySettings();
}

applySettings();
document.getElementById("line-highlight").onclick = () => toggleSetting("lineHighlight");
document.getElementById("line-num").onclick = () => toggleSetting("lineNumbers");

// font size button event
// font size on launch
fontSizeValue.textContent = persistentFontSize;
fontSize = persistentFontSize;

function updatePersistentFontSize(newSize) {
  if (newSize < 8) newSize = 8;
  if (newSize > 40) newSize = 40;

  persistentFontSize = newSize;
  fontSizeValue.textContent = persistentFontSize;
  localStorage.setItem(STORAGE_KEY, persistentFontSize);

  fontSize = persistentFontSize;
  monacoEditor.updateOptions({ fontSize: persistentFontSize });

  sizeDecrease.style.opacity = persistentFontSize <= 8 ? "0.25" : "1";
  sizeDecrease.style.pointerEvents = persistentFontSize <= 8 ? "none" : "auto";

  sizeIncrease.style.opacity = persistentFontSize >= 40 ? "0.25" : "1";
  sizeIncrease.style.pointerEvents = persistentFontSize >= 40 ? "none" : "auto";

  updateStatusBar?.();
}
updatePersistentFontSize(persistentFontSize);
sizeDecrease.addEventListener("click", () => {
  updatePersistentFontSize(persistentFontSize - 1);
});
sizeIncrease.addEventListener("click", () => {
  updatePersistentFontSize(persistentFontSize + 1);
});

// update font size with ctrl + mouse wheel / + - (temporary)
const updateFontSize = (newSize) => {
  fontSize = Math.max(8, Math.min(40, newSize));
  monacoEditor.updateOptions({ fontSize });
  if (currentTab) currentTab.fontSize = fontSize;
};

const editorDomNode = monacoEditor.getDomNode();
const scrollElement = editorDomNode.querySelector(".monaco-scrollable-element");

// Ctrl + mouse wheel
scrollElement.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      updateFontSize(fontSize + (e.deltaY < 0 ? 1 : -1));
      updateStatusBar();
    }
  },
  { passive: false }
);

// Ctrl + + / -
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    if (e.key === "=" || e.key === "+") {
      e.preventDefault();
      updateFontSize(fontSize + 1);
    } else if (e.key === "-") {
      e.preventDefault();
      updateFontSize(fontSize - 1);
    } else if (e.key === "0") {
      e.preventDefault();
      updateFontSize(persistentFontSize); // reset with ctrl + 0
    }
  }
});

// update padding on resize
window.addEventListener("resize", () => {
  const editorHeight = editor.clientHeight;
  monacoEditor.updateOptions({
    padding: {
      top: 12,
      bottom: editor.clientHeight / 2,
    },
  });
});

// initial editor theme
monaco.editor.setTheme("custom-theme");

// update ln & col
monacoEditor.onDidChangeCursorPosition(() => {
  updateStatusBar();
});
monacoEditor.onDidChangeCursorSelection(() => {
  updateStatusBar();
});

// call Find from menu
window.triggerFind = function () {
  monacoEditor.getAction("actions.find").run();
};
document.getElementById("triggerFindBtn").addEventListener("click", triggerFind);

// call Replace from menu
window.triggerReplace = function () {
  monacoEditor.getAction("editor.action.startFindReplaceAction").run();
};
document.getElementById("triggerReplaceBtn").addEventListener("click", triggerReplace);

// initial tab create
createTab();
switchTab(tabData[0]);
setTimeout(() => monacoEditor?.focus(), 0);

// menu button
menuButton.onclick = (e) => {
  e.stopPropagation();
  document.getElementById("custom-context-menu").style.display = "none";
  document.getElementById("tab-context-menu").style.display = "none";
  rightClickedTab = null;
  const isOpen = menu.style.display === "block";
  menu.style.display = isOpen ? "none" : "block";
  menuButton.style.pointerEvents = isOpen ? "auto" : "none";
};

// close menu & context menu on outside click
document.addEventListener("mousedown", (e) => {
  if (!customContextMenu.contains(e.target)) {
    customContextMenu.style.display = "none";
  }
  if (!tabContextMenu.contains(e.target)) {
    tabContextMenu.style.display = "none";
    rightClickedTab = null;
  }
  if (!menu.contains(e.target) && !themeMenu.contains(e.target) && !recentMenu.contains(e.target)) {
    menu.style.display = "none";
    themeMenu.style.display = "none";
    recentMenu.style.display = "none";
    menuButton.style.pointerEvents = "auto";
  }
});

// close menu & context menu on button click
document.addEventListener("click", (e) => {
  const button = e.target.closest("button");

  // context menu
  if (customContextMenu.contains(e.target) && button) {
    customContextMenu.style.display = "none";
  }
  if (tabContextMenu.contains(e.target) && button) {
    tabContextMenu.style.display = "none";
    rightClickedTab = null;
  }

  // themeMenu & menu (except for cetain buttons)
  if (menu.contains(e.target) && button && !excludedIds.includes(button.id)) {
    menu.style.display = "none";
    menuButton.style.pointerEvents = "auto";
  }

  // recentMenu menu
  if (recentMenu.contains(e.target) && button) {
    recentMenu.style.display = "none";
    menu.style.display = "none";
    menuButton.style.pointerEvents = "auto";
  }
});

// close menu & context menu on right click
document.addEventListener("contextmenu", (e) => {
  const button = e.target.closest("button");
  const isExcluded = button && excludedIds.includes(button.id);
  const insideTheme = themeMenu.contains(e.target);

  if (!isExcluded && !insideTheme) {
    menu.style.display = "none";
    themeMenu.style.display = "none";
    recentMenu.style.display = "none";
    menuButton.style.pointerEvents = "auto";
  }
});

// update theme & recent menu y position
function updateMenuPositions() {
  const changeBtnRect = changeThemeBtn.getBoundingClientRect();
  const recentBtnRect = openRecentBtn.getBoundingClientRect();

  themeMenu.style.top = `${changeBtnRect.top - 5}px`;
  recentMenu.style.top = `${recentBtnRect.top - 5}px`;
}
window.addEventListener("resize", updateMenuPositions);
window.addEventListener("wheel", updateMenuPositions, { passive: true });

// recent menu display
openRecentBtn.addEventListener("mouseenter", () => {
  populateRecentMenu();
  const recent = JSON.parse(localStorage.getItem("recentFiles") || "[]");
  if (recent.length > 0) {
    recentMenu.style.display = "inline-block";
    updateMenuPositions();
  }
});
openRecentBtn.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!recentMenu.matches(":hover") && !openRecentBtn.matches(":hover")) {
      recentMenu.style.display = "none";
    }
  }, 100);
});
recentMenu.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!recentMenu.matches(":hover") && !openRecentBtn.matches(":hover")) {
      recentMenu.style.display = "none";
    }
  }, 100);
});

// theme menu display
changeThemeBtn.addEventListener("mouseenter", () => {
  themeMenu.style.display = "block";
  updateMenuPositions();
});
changeThemeBtn.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!themeMenu.matches(":hover") && !changeThemeBtn.matches(":hover")) {
      themeMenu.style.display = "none";
    }
  }, 100);
});
themeMenu.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!themeMenu.matches(":hover") && !changeThemeBtn.matches(":hover")) {
      themeMenu.style.display = "none";
    }
  }, 100);
});

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.style.setProperty("--color1", "#121214");
    root.style.setProperty("--color2", "#1a1a1e");
    root.style.setProperty("--color3", "#242429");
  } else if (theme === "onyx") {
    root.style.setProperty("--color1", "#000000");
    root.style.setProperty("--color2", "#0c0c0e");
    root.style.setProperty("--color3", "#18181a");
  } else if (theme === "ash") {
    root.style.setProperty("--color1", "#2c2d32");
    root.style.setProperty("--color2", "#36373e");
    root.style.setProperty("--color3", "#484950");
  }

  monaco.editor.defineTheme("custom-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": getCSSVar("--color1"),
      "editor.foreground": "#ffffff",
    },
  });
  monaco.editor.setTheme("custom-theme");
}

// theme button click & update button checkmark
function updateActiveButton() {
  themeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-theme") === currentTheme);
  });
}
themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.getAttribute("data-theme");
    currentTheme = theme;
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    updateActiveButton();
  });
});
applyTheme(currentTheme);
updateActiveButton();

document.getElementById("openFileBtn").addEventListener("click", openFile);
document.getElementById("saveFileBtn").addEventListener("click", saveFile);
document.getElementById("saveAsFileBtn").addEventListener("click", saveAsFile);
document.getElementById("toggleStatusBar").addEventListener("click", toggleStatusBar);

// print button
document.getElementById("print-button").addEventListener("click", () => {
  const content = monacoEditor.getValue();
  const fontFamily = monacoEditor.getRawOptions().fontFamily || "monospace";
  window.electronAPI.printContent({ text: content, fontFamily });
});

// about button
document.getElementById("aboutBtn").addEventListener("click", () => {
  const overlay = document.getElementById("confirm-save-background");
  const about = document.getElementById("about");

  overlay.style.display = "flex";
  about.style.display = "flex";
});

document.getElementById("about-close").addEventListener("click", () => {
  const overlay = document.getElementById("confirm-save-background");
  const about = document.getElementById("about");

  overlay.style.display = "none";
  about.style.display = "none";
});

// window controls
document.getElementById("min-button").addEventListener("click", () => {
  window.electronAPI.minimizeWindow();
});

document.getElementById("max-button").addEventListener("click", () => {
  window.electronAPI.toggleMaximizeWindow();
});

document.getElementById("close-button").addEventListener("click", () => {
  attemptCloseWindow();
});

// add tab (+) button
addTabButton.onclick = () => {
  createTab();
  switchTab(tabData.at(-1));
  setTimeout(() => {
    monacoEditor.focus();
  }, 0);
};
// new tab button
newTabBtn.addEventListener("click", (e) => {
  e.preventDefault();
  createTab();
  switchTab(tabData.at(-1));
  setTimeout(() => {
    monacoEditor.focus();
  }, 0);
});

// new window button
newWindowBtn.addEventListener("click", () => {
  window.electronAPI.createNewWindow();
});

// file drag & drop
window.addEventListener("dragover", (e) => {
  e.preventDefault();
});

window.addEventListener("drop", async (e) => {
  e.preventDefault();
  if (!e.dataTransfer.files.length) return;

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const filePath = await window.electronAPI.getPathForFile(file);
  if (!filePath) {
    alert("Failed to get file path.");
    return;
  }

  await loadFileByPath(filePath);
});

// toggle statusbar
function toggleStatusBar() {
  statusBarVisible = !statusBarVisible;
  localStorage.setItem("statusBarVisible", statusBarVisible);
  const statusBar = document.getElementById("status-bar");
  const checkmark = document.querySelector("#toggleStatusBar .checkmark");

  if (statusBarVisible) {
    statusBar.style.display = "flex";
    checkmark.style.display = "inline-block";
    editor.style.height = "calc(100vh - 35px - 25px)";
    fontLayoutMenu.style.height = "calc(100vh - 35px - 25px)";
  } else {
    statusBar.style.display = "none";
    checkmark.style.display = "none";
    editor.style.height = "calc(100vh - 35px)";
    fontLayoutMenu.style.height = "calc(100vh - 35px)";
  }

  if (monacoEditor) {
    setTimeout(() => monacoEditor.layout(), 0);
  }
}
toggleStatusBar();
toggleStatusBar();

// update status bar
function updateStatusBar() {
  if (!monacoEditor) return;

  const position = monacoEditor.getPosition();
  const model = monacoEditor.getModel();
  const eol = model.getEOL();
  const currentEncoding = "UTF-8";

  let lineEnding = "Unknown";
  if (eol === "\r\n") {
    lineEnding = "Windows (CRLF)";
  } else if (eol === "\n") {
    lineEnding = "Unix (LF)";
  } else if (eol === "\r") {
    lineEnding = "Mac (CR)";
  }

  document.getElementById("status-left").textContent = currentFilePath;
  document.getElementById("status-left").title = currentFilePath;
  document.getElementById("line-col").textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
  document.getElementById("zoom-level").textContent = `${Math.round((fontSize / persistentFontSize) * 100)}%`;
  document.getElementById("line-ending").textContent = lineEnding;
  document.getElementById("encoding").textContent = currentEncoding;
  document.getElementById("encoding").title =
    "This editor supports only UTF-8.\nIf you want to use other encodings, please convert them to UTF-8 before opening.";
}

// tab dragging
function enableTabDragging(tab, data) {
  tab.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest(".close")) return;
    draggingTab = tab;
    dragIndex = tabData.indexOf(data);
    startX = e.clientX;
    currentX = 0;
    tab.style.zIndex = "10";
    tab.style.transition = "none";
    tab.style.position = "relative";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  function onMouseMove(e) {
    if (!draggingTab) return;
    currentX = e.clientX - startX;
    draggingTab.style.transform = `translateX(${currentX}px)`;
    tabs.classList.add("dragging");

    const tabsArray = Array.from(tabs.children).filter((el) => el.classList.contains("tab"));
    const currentRect = draggingTab.getBoundingClientRect();

    for (let i = 0; i < tabsArray.length; i++) {
      const targetTab = tabsArray[i];
      if (targetTab === draggingTab) continue;

      const targetRect = targetTab.getBoundingClientRect();
      const targetCenter = targetRect.left + targetRect.width / 2;

      // right drag
      if (currentX > 0 && currentRect.right > targetCenter && i > dragIndex) {
        const oldLeft = currentRect.left;

        tabs.insertBefore(draggingTab, targetTab.nextSibling);
        switchTab(currentTab);

        const newRect = draggingTab.getBoundingClientRect();
        const deltaX = oldLeft - newRect.left;

        currentX += deltaX;
        draggingTab.style.transform = `translateX(${currentX}px)`;

        [tabData[dragIndex], tabData[i]] = [tabData[i], tabData[dragIndex]];
        dragIndex = i;
        startX = e.clientX - currentX;

        break;
      }
      // left drag
      else if (currentX < 0 && currentRect.left < targetCenter && i < dragIndex) {
        const oldLeft = currentRect.left;

        tabs.insertBefore(draggingTab, targetTab);
        switchTab(currentTab);

        const newRect = draggingTab.getBoundingClientRect();
        const deltaX = oldLeft - newRect.left;

        currentX += deltaX;
        draggingTab.style.transform = `translateX(${currentX}px)`;

        [tabData[dragIndex], tabData[i]] = [tabData[i], tabData[dragIndex]];
        dragIndex = i;
        startX = e.clientX - currentX;

        break;
      }
    }
  }

  function onMouseUp() {
    if (!draggingTab) return;
    tabs.classList.remove("dragging");
    draggingTab.style.transition = "";
    draggingTab.style.transform = "";
    draggingTab.style.zIndex = "";
    draggingTab.style.position = "";
    draggingTab.style.pointerEvents = "";
    draggingTab = null;
    dragIndex = -1;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// create tab
function createTab(name = "Untitled.txt", content = "", path = null) {
  const tab = document.createElement("div");
  tab.className = "tab";

  const nameSpan = document.createElement("span");
  nameSpan.className = "name";
  nameSpan.textContent = name;

  const close = document.createElement("span");
  close.className = "close";

  const unsavedDot = document.createElement("div");
  unsavedDot.className = "unsaved-dot";

  const closeSvg = document.createElement("div");
  closeSvg.className = "close-svg";
  closeSvg.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.74 8.74" width="10" height="10">
            <line x1="8.24" y1=".5" x2=".5" y2="8.24"
                  fill="none" stroke="#fff" stroke-linecap="round" stroke-miterlimit="10"/>
            <line x1="8.24" y1="8.24" x2=".5" y2=".5"
                  fill="none" stroke="#fff" stroke-linecap="round" stroke-miterlimit="10"/>
          </svg>
        `;

  close.appendChild(unsavedDot);
  close.appendChild(closeSvg);

  tab.appendChild(nameSpan);
  tab.appendChild(close);
  tabs.appendChild(tab);

  const data = {
    name,
    content,
    path,
    element: tab,
    selection: null,
    fontSize: persistentFontSize,
    unsavedIndicator: true, // true:saved false:unsaved
  };
  tabData.push(data);

  close.onclick = async (e) => {
    e.stopPropagation();
    await attemptCloseTab(data);
  };

  tab.onclick = (e) => {
    if (e.target.closest(".close")) return;
    switchTab(data);
  };

  // tab drag handler
  enableTabDragging(tab, data);
}

// close tab
async function attemptCloseTab(data) {
  return new Promise((resolve) => {
    const tab = data.element;

    if (!data.unsavedIndicator) {
      const confirmBox = document.getElementById("confirm-save-background");
      const confirmSave = document.getElementById("confirm-save");
      const message = document.querySelector("#confirm-save p");
      const yesBtn = document.getElementById("confirm-save-yes");
      const noBtn = document.getElementById("confirm-save-no");
      const cancelBtn = document.getElementById("confirm-save-cancel");

      message.textContent = `Save changes to "${data.name}"?`;
      confirmBox.style.display = "flex";
      confirmSave.style.display = "flex";

      const actuallyCloseTab = () => {
        const index = tabData.indexOf(data);
        tabs.removeChild(tab);
        tabData = tabData.filter((t) => t !== data);

        if (tab.classList.contains("active")) {
          if (tabData.length) {
            const newIndex = index > 0 ? index - 1 : 0;
            switchTab(tabData[newIndex]);
            setTimeout(() => monacoEditor?.focus(), 0);
          } else {
            if (monacoEditor) monacoEditor.setValue("");
            currentTab = null;
            createTab();
            switchTab(tabData[0]);
            setTimeout(() => monacoEditor?.focus(), 0);
          }
        }
      };

      const removeListeners = () => {
        yesBtn.removeEventListener("click", onSave);
        noBtn.removeEventListener("click", onDontSave);
        cancelBtn.removeEventListener("click", onCancel);
      };

      const onSave = async () => {
        confirmBox.style.display = "none";
        confirmSave.style.display = "none";
        switchTab(data);
        let success = false;

        if (data.path) {
          success = await saveFile();
        } else {
          success = await saveAsFile();
        }

        if (success !== false) {
          actuallyCloseTab();
          resolve("closed");
        } else {
          resolve("cancelled");
        }

        removeListeners();
      };

      const onDontSave = () => {
        confirmBox.style.display = "none";
        confirmSave.style.display = "none";
        actuallyCloseTab();
        removeListeners();
        resolve("closed");
      };

      const onCancel = () => {
        confirmBox.style.display = "none";
        confirmSave.style.display = "none";
        removeListeners();
        resolve("cancelled");
      };

      yesBtn.addEventListener("click", onSave);
      noBtn.addEventListener("click", onDontSave);
      cancelBtn.addEventListener("click", onCancel);
      return;
    }

    // close immediately when save is not required
    const index = tabData.indexOf(data);
    tabs.removeChild(tab);
    tabData = tabData.filter((t) => t !== data);

    if (tab.classList.contains("active")) {
      if (tabData.length) {
        const newIndex = index > 0 ? index - 1 : 0;
        switchTab(tabData[newIndex]);
        setTimeout(() => monacoEditor?.focus(), 0);
      } else {
        if (monacoEditor) monacoEditor.setValue("");
        currentTab = null;
        createTab();
        switchTab(tabData[0]);
        setTimeout(() => monacoEditor?.focus(), 0);
      }
    }

    resolve("closed");
  });
}

// close window
function attemptCloseWindow() {
  const hasUnsavedTabs = tabData.some((tab) => !tab.unsavedIndicator);
  if (!hasUnsavedTabs) {
    window.electronAPI.closeWindow();
    return;
  }

  const confirmBox = document.getElementById("confirm-save-background");
  const confirmWindow = document.getElementById("confirm-save-window");

  const saveAllBtn = document.getElementById("confirm-save-all");
  const discardAllBtn = document.getElementById("confirm-discard-all");
  const cancelAllBtn = document.getElementById("confirm-cancel-all");

  confirmBox.style.display = "flex";
  confirmWindow.style.display = "flex";

  const removeListeners = () => {
    saveAllBtn.removeEventListener("click", onSaveAll);
    discardAllBtn.removeEventListener("click", onDiscardAll);
    cancelAllBtn.removeEventListener("click", onCancelAll);
  };

  const closeConfirm = () => {
    confirmBox.style.display = "none";
    confirmWindow.style.display = "none";
  };

  const onSaveAll = async () => {
    closeConfirm();

    const cancelledTabs = [];

    const allTabs = [...tabData];

    for (const tab of allTabs) {
      switchTab(tab);

      if (!tab.unsavedIndicator) {
        let success = false;
        if (tab.path) {
          success = await saveFile();
        } else {
          success = await saveAsFile();
        }

        if (success === false) {
          cancelledTabs.push(tab); // keep canceled tab
          continue;
        }
      }

      // close saved tab
      const index = tabData.indexOf(tab);
      if (index !== -1) {
        tabs.removeChild(tab.element);
        tabData.splice(index, 1);
      }
    }

    removeListeners();

    if (cancelledTabs.length === 0) {
      window.electronAPI.closeWindow();
    } else {
      switchTab(cancelledTabs[0]);
      setTimeout(() => monacoEditor?.focus(), 0);
    }
  };

  const onDiscardAll = () => {
    closeConfirm();
    removeListeners();

    // close all tabs
    for (const tab of [...tabData]) {
      tabs.removeChild(tab.element);
    }
    tabData = [];
    window.electronAPI.closeWindow();
  };

  const onCancelAll = () => {
    closeConfirm();
    removeListeners();
  };

  saveAllBtn.addEventListener("click", onSaveAll);
  discardAllBtn.addEventListener("click", onDiscardAll);
  cancelAllBtn.addEventListener("click", onCancelAll);
}

// switch tab
function switchTab(data) {
  if (!monacoEditor) return;

  const currentActive = tabData.find((t) => t.element.classList.contains("active"));
  if (currentActive) {
    // save tab data
    currentActive.content = monacoEditor.getValue();
    currentActive.selection = monacoEditor.getSelection();
    currentActive.fontSize = fontSize;
    currentActive.wordWrap = isWordWrapOn;
    currentActive.isMarkdown = isMarkdownOn;
  }

  fontSize = data.fontSize || persistentFontSize; // font size for each tabs
  monacoEditor.updateOptions({ fontSize });
  isWordWrapOn = data.wordWrap ?? true;
  isMarkdownOn = data.isMarkdown ?? false;
  monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "on" : "off" });
  const model = monacoEditor.getModel();
  monaco.editor.setModelLanguage(model, isMarkdownOn ? "markdown" : "plaintext");

  // update tab style
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active", "prev-active");
  });

  const newActive = data.element;
  newActive.classList.add("active");

  const prev = newActive.previousElementSibling;
  if (prev && prev.classList.contains("tab")) {
    prev.classList.add("prev-active");
  }

  // update tab content
  monacoEditor.setValue(data.content);

  if (data.originalContent === undefined) {
    data.originalContent = data.content;
  }

  currentTab = data;
  currentFilePath = data.path || data.name;

  // restore selection
  if (data.selection) {
    setTimeout(() => {
      monacoEditor.setSelection(data.selection);
      monacoEditor.focus();
    }, 0);
  }

  updateStatusBar();

  // restore WordWrap state
  isWordWrapOn = data.wordWrap ?? true;
  monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "on" : "off" });
  const wrapBtn = document.querySelector('button[data-action="wordWrap"] svg.checkmark');
  if (wrapBtn) wrapBtn.style.display = isWordWrapOn ? "inline-block" : "none";

  // restore Markdown state
  isMarkdownOn = data.isMarkdown ?? false;
  monaco.editor.setModelLanguage(monacoEditor.getModel(), isMarkdownOn ? "markdown" : "plaintext");
  const mdBtn = document.querySelector('button[data-action="toggleMarkdown"] svg.checkmark');
  if (mdBtn) mdBtn.style.display = isMarkdownOn ? "inline-block" : "none";

  // stop current watcher
  if (currentWatcher) {
    clearInterval(currentWatcher);
    currentWatcher = null;
  }

  // watch tab with path
  if (data.path) {
    window.electronAPI.watchFile(data.path);
  }
}

// detect when file is moved, deleted, or renamed
window.electronAPI.onFileChanged((event, { filePath, eventType }) => {
  const targetTab = tabData.find((tab) => tab.path === filePath);
  if (!targetTab) return;

  if (eventType === "rename") {
    // if file is not found
    targetTab.element.querySelector(".name").style.textDecoration = "line-through";
    targetTab.element.querySelector(".name").style.color = "#cf5d6e";
  } else if (eventType === "change") {
    // if file is changed
    handleFileChange(targetTab, filePath);
  }
});

async function handleFileChange(targetTab, filePath) {
  let content = null;
  try {
    content = await window.electronAPI.readFile(filePath);
  } catch (e) {
    content = null;
  }

  if (content === null) {
    // line-through name if file is not found
    targetTab.element.querySelector(".name").style.textDecoration = "line-through";
    targetTab.element.querySelector(".name").style.color = "#cf5d6e";
  } else {
    // remove line-through if file is found
    targetTab.element.querySelector(".name").style.textDecoration = "";
    targetTab.element.querySelector(".name").style.color = "white";

    // update current tab content if needed
    if (
      targetTab === currentTab &&
      content !== monacoEditor.getValue() &&
      document.activeElement !== monacoEditor.getDomNode()
    ) {
      if (targetTab._lastExternalContent === content) return;

      targetTab._lastExternalContent = content;
      targetTab._ignoreUnsavedCheck = true;
      const pos = monacoEditor.getPosition();
      monacoEditor.setValue(content);
      if (pos) monacoEditor.setPosition(pos);
      targetTab.originalContent = content;
      console.log("content updated");
      updateStatusBar();
    }
  }
}

// open file
async function openFile() {
  const filePath = await window.electronAPI.openFileDialog();
  if (!filePath) return;
  await loadFileByPath(filePath);
}

// file load hadling
async function loadFileByPath(filePath) {
  if (!filePath) return;

  const existingTab = tabData.find((tab) => tab.path === filePath);
  if (existingTab) {
    switchTab(existingTab);
    showMessage("file-opened");
    console.log("path already opened. switching to that tab.");
    return;
  }

  const content = await window.electronAPI.readFile(filePath);
  if (!content) {
    alert("Failed to read file.");
    return;
  }

  if (tabData.length === 1) {
    const singleTab = tabData[0];
    const currentContent = monacoEditor ? monacoEditor.getValue() : "";
    if (!singleTab.content.trim() && !currentContent.trim()) {
      singleTab.name = filePath.split(/[/\\]/).pop();
      singleTab.content = content;
      singleTab._lastExternalContent = content;
      singleTab.path = filePath;
      singleTab.originalContent = content;
      singleTab.unsavedIndicator = true;

      const nameSpan = singleTab.element.querySelector(".name");
      if (nameSpan) nameSpan.textContent = singleTab.name;

      const close = singleTab.element.querySelector(".close");
      if (close) close.classList.remove("show-unsaved");

      monacoEditor.setValue(content);
      switchTab(singleTab);
      updateRecentFiles(filePath);
      return;
    }
  }

  const newTab = createTab(filePath.split(/[/\\]/).pop(), content, filePath);
  const newTabData = tabData[tabData.length - 1];
  newTabData.originalContent = content;
  newTabData._lastExternalContent = content;
  newTabData.unsavedIndicator = true;

  const newTabClose = newTabData.element.querySelector(".close");
  if (newTabClose) newTabClose.classList.remove("show-unsaved");

  switchTab(tabData.at(-1));
  updateRecentFiles(filePath);
}

// recently opened file handler
function updateRecentFiles(filePath) {
  if (!filePath) return;
  let recent = JSON.parse(localStorage.getItem("recentFiles") || "[]");
  recent = recent.filter((p) => p !== filePath); // remove duplication
  recent.unshift(filePath);
  if (recent.length > 8) recent = recent.slice(0, 8);
  localStorage.setItem("recentFiles", JSON.stringify(recent));
  populateRecentMenu();
}

// update open recent menu
async function populateRecentMenu() {
  let recent = JSON.parse(localStorage.getItem("recentFiles") || "[]");

  // Compatible with old format: if string, convert to { path, exists }
  recent = recent
    .map((item) => {
      if (typeof item === "string") return { path: item, exists: true };
      if (typeof item === "object" && typeof item.path === "string") {
        return { path: item.path, exists: true };
      }
      return null;
    })
    .filter(Boolean); // Exclude null and undefined

  const seenPaths = new Set();
  recent = recent.filter((entry) => {
    if (seenPaths.has(entry.path)) return false;
    seenPaths.add(entry.path);
    return true;
  });

  // check file existance
  for (const entry of recent) {
    try {
      entry.exists = await window.electronAPI.fileExists(entry.path);
    } catch {
      entry.exists = false;
    }
  }

  // store existing files up to 8 & non existing files up to 8 (order maintained)
  const nextRecent = [];
  let validCount = 0;

  for (const entry of recent) {
    if (entry.exists) {
      if (validCount < 8) {
        nextRecent.push({ path: entry.path, exists: true });
        validCount++;
      }
    } else {
      nextRecent.push({ path: entry.path, exists: false });
    }
    if (nextRecent.length >= 16) break;
  }

  localStorage.setItem("recentFiles", JSON.stringify(nextRecent));

  // update menu with only existing files
  const displayEntries = nextRecent.filter((e) => e.exists).slice(0, 8);

  recentMenu.innerHTML = "";

  const btnText = openRecentBtn.querySelector(".btn-text");
  const btnSvg = openRecentBtn.querySelector("svg");

  // disable button when no recently opened files
  if (displayEntries.length === 0) {
    btnText.style.opacity = "0.25";
    btnSvg.style.opacity = "0.25";
    openRecentBtn.style.pointerEvents = "none";
    recentMenu.style.display = "none";
    return;
  }

  btnText.style.opacity = "1";
  btnSvg.style.opacity = "1";
  openRecentBtn.style.pointerEvents = "auto";

  displayEntries.forEach(({ path }) => {
    const button = document.createElement("button");
    const span = document.createElement("span");
    span.textContent = path;

    button.appendChild(span);
    button.title = path;

    button.addEventListener("click", async () => {
      recentMenu.style.display = "none";
      console.log("Opening file:", path, typeof path);
      if (typeof path === "string") {
        await loadFileByPath(path);
      } else {
        console.warn("Invalid path value:", path);
      }
    });
    recentMenu.appendChild(button);
  });

  // clear buttons
  const hr = document.createElement("div");
  hr.className = "hr";
  recentMenu.appendChild(hr);

  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear Recently Opened";
  clearButton.className = "clear-recent-btn";
  clearButton.addEventListener("click", () => {
    localStorage.removeItem("recentFiles");
    populateRecentMenu();
  });
  recentMenu.appendChild(clearButton);
}
populateRecentMenu();

// save as
async function saveAsFile() {
  const active = tabData.find((t) => t.element.classList.contains("active"));
  if (!active || !monacoEditor) return;

  const content = monacoEditor.getValue();
  const { filePath } = await window.electronAPI.showSaveDialog(active.name);
  if (!filePath) return false;

  const result = await window.electronAPI.saveToFile(filePath, content);
  if (result.success) {
    active.path = filePath;
    active.name = filePath.split(/[\\/]/).pop();
    active.element.querySelector(".name").textContent = active.name;
    active.originalContent = content;
    active.unsavedIndicator = true;

    currentFilePath = filePath;
    updateStatusBar();

    const activeClose = active.element.querySelector(".close");
    if (activeClose) activeClose.classList.remove("show-unsaved");

    updateRecentFiles(filePath);
    showMessage("file-saved");
    switchTab(active);
    return true;
  } else {
    console.error("Failed to save file:", result.error);
    return false;
  }
}

// overwrite save
async function saveFile() {
  const active = tabData.find((t) => t.element.classList.contains("active"));
  console.log("Saving file path:", active?.path);
  if (!active || !monacoEditor) return false;

  // excute saveAsFile when no path
  if (!active.path) {
    return await saveAsFile();
  }

  if (active.unsavedIndicator) {
    console.log("No changes to save.");
    return true;
  }

  const content = monacoEditor.getValue();
  const result = await window.electronAPI.saveToFile(active.path, content);
  if (result.success) {
    console.log("File saved successfully");

    // udpate unsaved indicator when saved
    active.originalContent = content;
    active.unsavedIndicator = true;

    const activeSaveClose = active.element.querySelector(".close");
    if (activeSaveClose) activeSaveClose.classList.remove("show-unsaved");
    showMessage("file-saved");
  } else {
    console.error("Failed to save file:", result.error);
    if (result.error.includes("EPERM")) {
      return await saveAsFile();
    }
  }
}

// file saved & file already opened message
function showMessage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("show");
  setTimeout(() => {
    el.classList.remove("show");
  }, 1500);
}

// Tab context menu handler
document.addEventListener("contextmenu", (e) => {
  const tabElement = e.target.closest(".tab");
  if (!tabElement) return;

  e.preventDefault();
  rightClickedTab = tabData.find((t) => t.element === tabElement);
  if (!rightClickedTab) return;

  // Hide editor context menu
  document.getElementById("custom-context-menu").style.display = "none";

  const menu = document.getElementById("tab-context-menu");

  // Update copy & open path button
  updateTabContextMenuState(menu, rightClickedTab);

  // menu position
  menu.style.display = "block";
  menu.style.visibility = "hidden";

  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;

  let left = e.pageX;
  let top = e.pageY;

  if (left + menuWidth > pageWidth) {
    left = Math.max(0, pageWidth - menuWidth);
  }
  if (top + menuHeight > pageHeight) {
    top = Math.max(0, pageHeight - menuHeight);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.visibility = "visible";
  menu.style.display = "flex";
});

// update copy & open path button based on path existance
function updateTabContextMenuState(menu, tab) {
  const copyPathBtn = menu.querySelector('[data-action="copyPath"]');
  const openPathBtn = menu.querySelector('[data-action="openPath"]');

  const hasPath = tab && tab.path;

  if (copyPathBtn) {
    const label = copyPathBtn.querySelector(".label");
    if (hasPath) {
      label.style.opacity = "1";
      copyPathBtn.style.pointerEvents = "auto";
    } else {
      label.style.opacity = "0.25";
      copyPathBtn.style.pointerEvents = "none";
    }
  }

  if (openPathBtn) {
    const label = openPathBtn.querySelector(".label");
    if (hasPath) {
      label.style.opacity = "1";
      openPathBtn.style.pointerEvents = "auto";
    } else {
      label.style.opacity = "0.25";
      openPathBtn.style.pointerEvents = "none";
    }
  }
}

// Close multiple tabs one by one (close others, close to the right & close saved)
async function closeTabsSequentially(tabsToClose) {
  if (tabsToClose.length === 0) return;

  for (const tabToClose of tabsToClose) {
    // Check if tab still exists (might have been closed already)
    if (tabData.includes(tabToClose)) {
      const closed = await attemptCloseTab(tabToClose);
      // If user cancelled, stop the process
      if (closed === "cancelled") {
        break;
      }
    }
  }
}

// Tab context menu click handler
document.getElementById("tab-context-menu").addEventListener("click", async (e) => {
  const action = e.target.closest("button")?.dataset.action;
  if (!action || !rightClickedTab) return;

  const targetTab = rightClickedTab;

  document.getElementById("tab-context-menu").style.display = "none";
  rightClickedTab = null;

  switch (action) {
    case "close":
      await attemptCloseTab(targetTab);
      break;

    case "closeOthers":
      const otherTabs = tabData.filter((t) => t !== targetTab);
      if (otherTabs.length > 0) {
        await closeTabsSequentially(otherTabs);
      }
      break;

    case "closeToRight":
      const rightClickedIndex = tabData.indexOf(targetTab);
      const tabsToRight = tabData.slice(rightClickedIndex + 1);
      if (tabsToRight.length > 0) {
        await closeTabsSequentially(tabsToRight);
      }
      break;

    case "closeSaved":
      const savedTabs = tabData.filter((t) => t.unsavedIndicator);
      if (savedTabs.length > 0) {
        await closeTabsSequentially(savedTabs);
      }
      break;

    case "copyPath":
      if (targetTab && targetTab.path) {
        try {
          await navigator.clipboard.writeText(targetTab.path);
        } catch (err) {
          console.error("Failed to copy path:", err);
        }
      }
      break;

    case "openPath":
      if (targetTab && targetTab.path) {
        try {
          await window.electronAPI.openPath(targetTab.path);
        } catch (err) {
          console.error("Failed to open path:", err);
        }
      }
      break;
  }
});

// editor context menu display & position handler
editor.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  document.getElementById("tab-context-menu").style.display = "none";
  rightClickedTab = null;
  const menu = document.getElementById("custom-context-menu");

  menu.style.display = "block";
  menu.style.visibility = "hidden";

  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;

  let left = e.pageX;
  let top = e.pageY;

  // X
  if (left + menuWidth > pageWidth) {
    left = Math.max(0, pageWidth - menuWidth);
  }

  // Y
  if (top + menuHeight > pageHeight) {
    top = Math.max(35, pageHeight - menuHeight);
  } else {
    top = Math.max(35, top);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.visibility = "visible";
  menu.style.display = "flex";
});

// editor context menu click handler
document.getElementById("custom-context-menu").addEventListener("click", async (e) => {
  const actionElement = e.target.closest("[data-action]");
  if (!actionElement) {
    return;
  }
  const action = actionElement.dataset.action;
  if (!action) {
    return;
  }

  const model = monacoEditor.getModel();

  switch (action) {
    case "cut":
      document.execCommand("cut");
      break;
    case "copy":
      document.execCommand("copy");
      break;
    case "paste":
      try {
        const text = await navigator.clipboard.readText();
        monacoEditor.trigger("keyboard", "type", { text });
      } catch (err) {
        console.error("Paste failed:", err);
      }
      break;
    case "undo":
      monacoEditor.trigger("keyboard", "undo", null);
      break;
    case "redo":
      monacoEditor.trigger("keyboard", "redo", null);
      break;
    case "selectAll":
      monacoEditor.trigger("keyboard", "editor.action.selectAll", null);
      break;
    case "wordWrap":
      isWordWrapOn = !isWordWrapOn;
      if (currentTab) currentTab.wordWrap = isWordWrapOn;
      monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "on" : "off" });
      {
        const btn = e.target.closest('button[data-action="wordWrap"]');
        if (btn) {
          const svg = btn.querySelector("svg.checkmark");
          if (svg) svg.style.display = isWordWrapOn ? "inline-block" : "none";
        }
      }
      break;
    case "toggleMarkdown":
      const currentLang = monaco.editor.getModel(monacoEditor.getModel().uri).getLanguageId();
      isMarkdownOn = currentLang !== "markdown";
      if (currentTab) currentTab.isMarkdown = isMarkdownOn;
      monaco.editor.setModelLanguage(model, isMarkdownOn ? "markdown" : "plaintext");
      {
        const btn = e.target.closest('button[data-action="toggleMarkdown"]');
        if (btn) {
          const svg = btn.querySelector("svg.checkmark");
          if (svg) svg.style.display = isMarkdownOn ? "inline-block" : "none";
        }
      }
      break;
  }

  setTimeout(() => {
    document.getElementById("custom-context-menu").style.display = "none";
  }, 0);
});

// keep focus on editor when context menu is opened
document.getElementById("custom-context-menu").addEventListener("mousedown", (e) => {
  e.preventDefault();
});

// font & layout menu display
fontLayoutButton.addEventListener("click", (e) => {
  e.stopPropagation();
  fontLayoutMenu.style.display = "block";
  menu.style.display = "none";
  menuButton.style.pointerEvents = "auto";
});
editor.addEventListener("click", () => {
  fontLayoutMenu.style.display = "none";
});
fontLayoutMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

// shortcuts
window.addEventListener("keydown", async (e) => {
  // Ctrl + S (+ Shift)
  if (e.ctrlKey && e.code === "KeyS") {
    e.preventDefault();
    if (e.shiftKey) {
      saveAsFile();
    } else {
      saveFile();
    }
  }
  // Ctrl + O
  if (e.ctrlKey && e.code === "KeyO") {
    e.preventDefault();
    openFile();
  }
  // Ctrl + T
  if (e.ctrlKey && e.code === "KeyT") {
    e.preventDefault();
    createTab();
    switchTab(tabData.at(-1));
    setTimeout(() => {
      monacoEditor.focus();
    }, 0);
  }
  // Ctrl + N
  if (e.ctrlKey && e.code === "KeyN") {
    e.preventDefault();
    window.electronAPI.createNewWindow();
  }
  // Ctrl + W
  if (e.ctrlKey && e.code === "KeyW") {
    e.preventDefault();
    const data = currentTab;
    if (!data) return;
    await attemptCloseTab(data);
  }
});
