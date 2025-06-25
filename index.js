import * as monaco from "monaco-editor";
import i18next from "i18next";

const tabsContainer = document.getElementById("tabs-container");
const tabs = document.getElementById("tabs");
const editor = document.getElementById("editor");
const addTabButton = document.getElementById("add-tab");
const menuButton = document.getElementById("menu-button");
const menu = document.getElementById("menu");
const changeThemeBtn = document.getElementById("changeTheme");
const themeMenu = document.getElementById("theme-menu");
const openRecentBtn = document.getElementById("openRecent");
const recentMenu = document.getElementById("recent-menu");
const newWindowBtn = document.getElementById("newWindowBtn");
const newTabBtn = document.getElementById("newTabBtn");
const fontSizeValue = document.getElementById("font-size-value");
const fontSizeDecrease = document.getElementById("font-size-decrease");
const fontSizeIncrease = document.getElementById("font-size-increase");
const tabSizeValue = document.getElementById("tab-size-value");
const tabSizeDecrease = document.getElementById("tab-size-decrease");
const tabSizeIncrease = document.getElementById("tab-size-increase");
const fontFamilySelect = document.getElementById("font-family-select");
const settingsButton = document.getElementById("settingsBtn");
const settingsMenu = document.getElementById("settings-menu");
const customContextMenu = document.getElementById("custom-context-menu");
const tabContextMenu = document.getElementById("tab-context-menu");
const excludedIds = ["changeTheme", "openRecent"]; // buttons that dont close menu on click

// status bar
const statusLeft = document.getElementById("status-left");
const lineColEl = document.getElementById("line-col");
const zoomLevelEl = document.getElementById("zoom-level");
const lineEndingEl = document.getElementById("line-ending");
const encodingEl = document.getElementById("encoding");

// modals
const confirmBox = document.getElementById("confirm-save-background");
const confirmSave = document.getElementById("confirm-save");
const yesBtn = document.getElementById("confirm-save-yes");
const noBtn = document.getElementById("confirm-save-no");
const cancelBtn = document.getElementById("confirm-save-cancel");
const confirmWindow = document.getElementById("confirm-save-window");
const saveAllBtn = document.getElementById("confirm-save-all");
const discardAllBtn = document.getElementById("confirm-discard-all");
const cancelAllBtn = document.getElementById("confirm-cancel-all");
const about = document.getElementById("about");
const fileDropBox = document.getElementById("file-drop-background");
const fileDrop = document.getElementById("file-drop");

const STORAGE_KEY = "monacoFontSizePersistent";
let persistentFontSize = Number(localStorage.getItem(STORAGE_KEY)) || 16;
let fontSize = persistentFontSize;
let tabSize = Math.min(10, Math.max(1, parseInt(localStorage.getItem("tabSize")) || 4));
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
let currentFilePath = `${i18next.t("file.untitled")}.txt`;
const defaultSettings = {
  lineHighlight: true,
  lineNumbers: false,
  minimap: true,
  syntaxHighlight: true,
};
const settings = JSON.parse(localStorage.getItem("editorSettings")) || defaultSettings;
let selectedFontFamily = localStorage.getItem("selectedFontFamily") || "Figtree";
let monacoEditor = null;

// tabs hover state, width handling
let tabAreaHovered = false;
let fixedTabsWidth = null;
let isHoveringLastTab = false;
let mouseX = 0;
let mouseY = 0;

// editor context menu
let isWordWrapOn = true;
let isMarkdownOn = false;

// modal display state
let isModalDisplayed = false;

// store right clicked tab
let rightClickedTab = null;

// watch only active tab, remove old watcher when tab switched (switchTab)
let currentWatcher = null;
// watch css file used as current theme
let currentWatchedCssFile = null;

// app version
window.electronAPI.getAppVersion().then((version) => {
  document.querySelector("#version-text").textContent = `v${version}`;
});

const langSwitcher = document.getElementById("langSwitcher");
const savedLang = localStorage.getItem("lang") || "en";
langSwitcher.value = savedLang;

// language
i18next
  .init({
    lng: savedLang,
    fallbackLng: "en",
    // git pull required when additional language PR merged in github.
    // mayb switch to i18next-fs-backend in the future
    resources: {
      en: { translation: require("./locales/en-US.json") },
      ja: { translation: require("./locales/ja-JP.json") },
    },
  })
  .then(() => {
    updateMenuLabels();
  });

function updateMenuLabels() {
  // menu
  document.querySelector("#newTabBtn .label").textContent = i18next.t("menu.new");
  document.querySelector("#newWindowBtn .label").textContent = i18next.t("menu.newWindow");
  document.querySelector("#openFileBtn .label").textContent = i18next.t("menu.open");
  document.querySelector("#openRecent .btn-text").textContent = i18next.t("menu.openRecent");
  document.querySelector("#saveFileBtn .label").textContent = i18next.t("menu.save");
  document.querySelector("#saveAsFileBtn .label").textContent = i18next.t("menu.saveAs");
  document.querySelector("#triggerFindBtn .label").textContent = i18next.t("menu.find");
  document.querySelector("#triggerReplaceBtn .label").textContent = i18next.t("menu.replace");
  document.getElementById("print-button").textContent = i18next.t("menu.print");
  document.querySelector("#changeTheme .btn-text").textContent = i18next.t("menu.theme");
  document.querySelector("#toggleStatusBar .btn-text").textContent = i18next.t("menu.statusBar");
  document.getElementById("settingsBtn").textContent = i18next.t("menu.settings");
  document.getElementById("aboutBtn").textContent = i18next.t("menu.about");
  document.getElementById("aboutBtn").textContent = i18next.t("menu.about");
  document.getElementById("aboutBtn").textContent = i18next.t("menu.about");
  document.querySelector('button[data-theme="onyx"] span').textContent = i18next.t("menu.onyx");
  document.querySelector('button[data-theme="dark"] span').textContent = i18next.t("menu.dark");
  document.querySelector('button[data-theme="ash"] span').textContent = i18next.t("menu.ash");

  // message
  document.getElementById("file-saved").textContent = i18next.t("message.saved");
  document.getElementById("file-opened").textContent = i18next.t("message.fileAlreadyOpened");
  document.getElementById("file-updated").textContent = i18next.t("message.fileUpdated");
  document.getElementById("file-modified").textContent = i18next.t("message.fileModified");

  // editor context menu
  document.querySelector('button[data-action="cut"] .label').textContent = i18next.t("editorMenu.cut");
  document.querySelector('button[data-action="copy"] .label').textContent = i18next.t("editorMenu.copy");
  document.querySelector('button[data-action="paste"] .label').textContent = i18next.t("editorMenu.paste");
  document.querySelector('button[data-action="undo"] .label').textContent = i18next.t("editorMenu.undo");
  document.querySelector('button[data-action="redo"] .label').textContent = i18next.t("editorMenu.redo");
  document.querySelector('button[data-action="selectAll"] .label').textContent = i18next.t("editorMenu.selectAll");
  document.querySelector('button[data-action="wordWrap"] span').textContent = i18next.t("editorMenu.wordWrap");
  document.querySelector('button[data-action="toggleMarkdown"] span').textContent =
    i18next.t("editorMenu.markdownMode");

  // tab context menu
  document.querySelector('button[data-action="close"] .label').textContent = i18next.t("tabMenu.close");
  document.querySelector('button[data-action="closeOthers"] .label').textContent = i18next.t("tabMenu.closeOthers");
  document.querySelector('button[data-action="closeToRight"] .label').textContent = i18next.t("tabMenu.closeToRight");
  document.querySelector('button[data-action="closeSaved"] .label').textContent = i18next.t("tabMenu.closeSaved");
  document.querySelector('button[data-action="copyPath"] .label').textContent = i18next.t("tabMenu.copyPath");
  document.querySelector('button[data-action="openPath"] .label').textContent = i18next.t("tabMenu.openPath");

  // settings
  document.querySelector("#settings-menu .font").textContent = i18next.t("settings.font");
  document.querySelector("#settings-menu .size").textContent = i18next.t("settings.size");
  document.getElementById("fontDescription").innerHTML = i18next.t("settings.fontDescription");
  document.getElementById("settingsLayout").textContent = i18next.t("settings.layout");
  document.querySelector("#line-highlight span").textContent = i18next.t("settings.highlightLine");
  document.querySelector("#line-num span").textContent = i18next.t("settings.lineNumbers");
  document.querySelector("#minimap span").textContent = i18next.t("settings.displayMinimap");
  document.querySelector("#toggleSyntaxHighlight span").textContent = i18next.t("settings.syntaxHighlight");
  document.querySelector("#settings-menu .tabSize").textContent = i18next.t("settings.tabSize");
  document.getElementById("settingsLanguage").textContent = i18next.t("settings.language");
  document.getElementById("langDescription").innerHTML = i18next.t("settings.langDescription");
  document.getElementById("settingsCustomTheme").textContent = i18next.t("settings.customTheme");
  document.getElementById("openThemeFolder").textContent = i18next.t("settings.openThemeFolder");
  document.getElementById("customThemeDescription").innerHTML = i18next.t("settings.customThemeDescription");

  // modal
  document.querySelector("#file-drop p").textContent = i18next.t("modal.fileDrop");
  document.getElementById("confirm-save-yes").textContent = i18next.t("modal.confirmSave");
  document.getElementById("confirm-save-no").textContent = i18next.t("modal.dontSave");
  document.getElementById("confirm-save-cancel").textContent = i18next.t("modal.cancel");
  document.querySelector("#confirm-save-window p").textContent = i18next.t("modal.confirmSaveWindow");
  document.getElementById("confirm-save-all").textContent = i18next.t("modal.saveAll");
  document.getElementById("confirm-discard-all").textContent = i18next.t("modal.discardAll");
  document.getElementById("confirm-cancel-all").textContent = i18next.t("modal.cancel");
  document.getElementById("description").textContent = i18next.t("modal.description");
  document.getElementById("discordServer").textContent = i18next.t("modal.discordServer");
  document.getElementById("creator").textContent = i18next.t("modal.creator");
  document.getElementById("disclaimer-title").textContent = i18next.t("modal.disclaimer");
}

langSwitcher.addEventListener("change", (e) => {
  const newLang = e.target.value;

  i18next.changeLanguage(newLang).then(() => {
    updateMenuLabels();
    updateStatusBar();
  });

  localStorage.setItem("lang", newLang);
});

// get css variable
// getCSSVar("--var-name"), getCSSVar("var(--color)"), getCSSVar("#ffffff") → "#ffffff"
function getCSSVar(nameOrValue, depth = 0) {
  // max depth to prevent infinite loop
  if (depth > 5) return nameOrValue;

  if (nameOrValue.startsWith("var(")) {
    // getCSSVar("var(--color)") → "#ffffff"
    const varMatch = nameOrValue.match(/^var\((--[^,\s)]+)(?:\s*,\s*[^)]+)?\)$/);
    if (varMatch) {
      const innerVarName = varMatch[1];
      const resolved = getComputedStyle(document.documentElement).getPropertyValue(innerVarName).trim();
      if (resolved && resolved !== nameOrValue) {
        return getCSSVar(resolved, depth + 1);
      }
    }
    return nameOrValue;
  } else if (nameOrValue.startsWith("--")) {
    // getCSSVar("--var-name") → "#ffffff"
    const value = getComputedStyle(document.documentElement).getPropertyValue(nameOrValue).trim();
    if (value.startsWith("var(")) {
      return getCSSVar(value, depth + 1);
    }
    return value;
  } else {
    // getCSSVar("#ffffff") → "#ffffff"
    return nameOrValue;
  }
}

// get monaco editor css variable
// getAllCSSVars("--vscode-") → editor.background:
function getAllCSSVars(prefix = "--", fromLast = true) {
  const result = Object.create(null);

  // search from last style tag if fromLast = true;
  const styleSheets = Array.from(document.styleSheets);
  if (fromLast) styleSheets.reverse();

  for (const sheet of styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    // process only :root
    const rootRule = Array.from(rules).find((rule) => rule.selectorText === ":root");
    if (!rootRule) continue;

    // search vars in :root
    for (const name of rootRule.style) {
      // verify beginning of var (--vscode → --vscode-editor-background)
      if (!name.startsWith(prefix)) continue;
      // remove prefix
      const varName = name.slice(prefix.length);
      let token;
      if (prefix === "--md-") {
        // --md-keyword → keyword.md
        token = varName.replace(/[-_]/g, ".") + ".md";
      } else {
        // --vscode-editor-background → editor.background
        token = varName.replace(/[-_]/g, ".");
      }
      // get original value if value was set as var
      const value = getCSSVar(rootRule.style.getPropertyValue(name).trim());
      result[token] = value;
    }
    // break with first found :root
    break;
  }

  if (Object.keys(result).length === 0) {
    console.warn("No :root rule with the specified prefix found.");
  }

  return result;
}

// define monapad language
monaco.languages.register({ id: "monapad" });
monaco.languages.setMonarchTokensProvider("monapad", {
  tokenizer: {
    root: [
      [/^\s*\d+\.\s/, "number-list"], // number list e.g., 1. item
      [/^\s*[-*+] /, "bullet-point"], // bullet points
      [/^\s*-#\s[^#].*/, "sub-text"], // -# subtext
      [/^\s*#\s[^#].*/, "heading-1"], // # heading
      [/^\s*##\s[^#].*/, "heading-2"], // ## heading
      [/^\s*###\s[^#].*/, "heading-3"], // ### heading
      [/^\s*>\s.*/, "block-quote"], // > blockquote
      [/```/, { token: "code-block-fence", next: "@codeblock" }], // code block
      [/`[^`]*`/, "inline-code"], // inline code block
    ],

    codeblock: [
      [/```/, { token: "code-block-fence", next: "@pop" }],
      [/.*$/, "code-block-content"],
    ],
  },
});

// apply colors to monaco editor
function createCustomTheme() {
  const isDefaultTheme = ["dark", "onyx", "ash"].includes(currentTheme);

  // vscode css vars
  const colors = Object.create(null);
  // isDefaultTheme: search first style tag, !isDefaultTheme: search last style tag
  const vscodeVars = isDefaultTheme ? getAllCSSVars("--vscode-", false) : getAllCSSVars("--vscode-", true);
  // --vscode-editor-background: #hex / var(--color) → editor.background = #hex
  Object.entries(vscodeVars).forEach(([token, value]) => {
    colors[token] = value;
  });

  // monapad, markdown css vars
  const rules = [];

  if (settings.syntaxHighlight) {
    function makeRule(token, colorVarBase) {
      return {
        token,
        foreground: getCSSVar(`--${colorVarBase}`),
        fontStyle: `${getCSSVar(`--${colorVarBase}Style`)}`.trim() || undefined,
      };
    }

    rules.push(
      makeRule("number-list", "numberList"),
      makeRule("bullet-point", "bulletPoint"),
      makeRule("sub-text", "subText"),
      makeRule("heading-1", "heading1"),
      makeRule("heading-2", "heading2"),
      makeRule("heading-3", "heading3"),
      makeRule("block-quote", "blockQuote"),
      makeRule("inline-code", "inlineCode"),
      makeRule("code-block-fence", "codeBlockFence"),
      makeRule("code-block-content", "codeBlock")
    );
  }

  if (!isDefaultTheme) {
    // search last style tag since default theme doesn't specify markdwon color
    const markdownVars = getAllCSSVars("--md-", true);
    // --strong-md: #hex / var(--color) → { token: "strong.md", foreground: #hex },
    const markdownRules = Object.entries(markdownVars).map(([token, value]) => ({ token, foreground: value }));
    rules.push(...markdownRules);
  }

  return {
    base: "vs-dark",
    inherit: true,
    rules,
    colors,
    insertSpaces: false,
  };
}
monaco.editor.defineTheme("custom-theme", createCustomTheme());

monacoEditor = monaco.editor.create(editor, {
  language: "monapad",
  wordWrap: "bounded",
  wordWrapColumn: 1000,
  minimap: { enabled: settings.minimap, renderCharacters: true },
  fontSize: persistentFontSize,
  renderLineHighlight: settings.lineHighlight ? "line" : "none",
  lineNumbers: settings.lineNumbers ? "on" : "off",
  folding: false,
  lineNumbersMinChars: settings.lineNumbers ? 4 : 2,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: editor.clientHeight / 2 },
  occurrencesHighlight: false,
  stickyScroll: { enabled: false },
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  wordBasedSuggestions: false,
  matchBrackets: "never",
  fontFamily: `"${selectedFontFamily}", "Yu Gothic UI", "Meiryo", "Hiragino Sans", sans-serif`,
  unicodeHighlight: {
    nonBasicASCII: false,
    ambiguousCharacters: false,
    invisibleCharacters: false,
  },
  autoClosingBrackets: false,
  contextmenu: false,
  renderIndentGuides: false,
  insertSpaces: false,
  tabSize: tabSize,
  find: {
    addExtraSpaceOnTop: false,
  },
  scrollbar: { horizontal: "hidden" },
});

// # and -#
let currentDecorations = [];

function applyDecorations() {
  const model = monacoEditor.getModel();
  if (!model) return;

  if (!settings.syntaxHighlight) {
    currentDecorations = monacoEditor.deltaDecorations(currentDecorations, []);
    return;
  }

  const fullText = model.getValue();
  const lines = fullText.split("\n");
  const decorations = [];

  if (model.getLanguageId() !== "monapad") {
    currentDecorations = monacoEditor.deltaDecorations(currentDecorations, []);
    return;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const leadingSpaces = line.length - trimmed.length;

    const matchers = [
      { regex: /^#\s[^#]/, className: "heading-1" }, // heading 1
      { regex: /^##\s[^#]/, className: "heading-2" }, // heading 2
      { regex: /^###\s[^#]/, className: "heading-3" }, // heading 3
      { regex: /^-#\s[^#]/, className: "sub-text" }, // sub text
      { regex: /^>\s/, className: "block-quote" }, // block quote
    ];

    for (const { regex, className } of matchers) {
      const match = trimmed.match(regex);
      if (match) {
        const markerLength = match[0].length;
        const startColumn = leadingSpaces + 1;
        const endColumn = startColumn + markerLength - 1;

        // always apply marker-transparent to leading marker
        decorations.push({
          range: new monaco.Range(i + 1, startColumn, i + 1, endColumn),
          options: { inlineClassName: "marker-transparent" },
        });

        // only apply sub-text class to the full line if sub-text matched
        if (className === "sub-text") {
          decorations.push({
            range: new monaco.Range(i + 1, startColumn, i + 1, line.length + 1),
            options: { inlineClassName: "sub-text" },
          });
        }

        break; // first match only
      }
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

  // use active._ignoreUnsavedCheck = ture before monacoEditor.getValue() when this process is unnecessary
  if (active._ignoreUnsavedCheck) {
    active._ignoreUnsavedCheck = false;
    return;
  }

  const hasUnsavedChanges = currentContent.trim() !== (active.originalContent || "").trim();
  active.isFileSaved = !hasUnsavedChanges;

  // display unsaved dot
  const close = active.element.querySelector(".close");
  if (close) {
    if (hasUnsavedChanges) {
      close.classList.add("show-unsaved");
    } else {
      close.classList.remove("show-unsaved");
    }
  }

  updateStatusBar();
  applyDecorations();
});
applyDecorations();

// get font using font-list and apply on launch
window.electronAPI.getFonts().then((fonts) => {
  const cleanedFonts = fonts.map((f) => f.trim().replace(/^"|"$/g, ""));
  const sortedFonts = cleanedFonts.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

  sortedFonts.forEach((fontName) => {
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
    fontFamily: `${cleanFontFamily}, "Yu Gothic UI", "Meiryo", "Hiragino Sans", sans-serif`,
  });
}

// editor layout
function applySettings() {
  monacoEditor.updateOptions({
    renderLineHighlight: settings.lineHighlight ? "line" : "none",
    lineNumbers: settings.lineNumbers ? "on" : "off",
    lineNumbersMinChars: settings.lineNumbers ? 4 : 2,
    minimap: {
      enabled: settings.minimap,
    },
  });

  document.querySelector("#line-highlight .checkmark").style.display = settings.lineHighlight ? "inline-block" : "none";
  document.querySelector("#line-num .checkmark").style.display = settings.lineNumbers ? "inline-block" : "none";
  document
    .querySelector("#minimap .checkmark")
    ?.style?.setProperty("display", settings.minimap ? "inline-block" : "none");
  document.querySelector("#toggleSyntaxHighlight .checkmark").style.display = settings.syntaxHighlight
    ? "inline-block"
    : "none";
}

function toggleSetting(key) {
  settings[key] = !settings[key];
  localStorage.setItem("editorSettings", JSON.stringify(settings));
  applySettings();
}

applySettings();
document.getElementById("line-highlight").onclick = () => toggleSetting("lineHighlight");
document.getElementById("line-num").onclick = () => toggleSetting("lineNumbers");
document.getElementById("minimap").onclick = () => toggleSetting("minimap");
document.getElementById("toggleSyntaxHighlight").onclick = () => {
  toggleSetting("syntaxHighlight");
  monaco.editor.defineTheme("custom-theme", createCustomTheme());
  monaco.editor.setTheme("custom-theme");
  applyDecorations();
};

// open custom theme button
document.getElementById("openThemeFolder").addEventListener("click", async () => {
  try {
    const userDataPath = await window.electronAPI.getUserDataPath();
    const themeFolderPath = `${userDataPath}/themes`;
    await window.electronAPI.openPath(themeFolderPath);
    console.log("themes path opened:", themeFolderPath);
  } catch (err) {
    console.error("Failed to open path:", err);
  }
});

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

  fontSizeDecrease.classList.toggle("disabled", persistentFontSize <= 8);
  fontSizeIncrease.classList.toggle("disabled", persistentFontSize >= 40);

  updateStatusBar?.();
}
updatePersistentFontSize(persistentFontSize);
fontSizeDecrease.addEventListener("click", () => {
  updatePersistentFontSize(persistentFontSize - 1);
});
fontSizeIncrease.addEventListener("click", () => {
  updatePersistentFontSize(persistentFontSize + 1);
});

// tab size button event
// tab size on launch
tabSizeValue.textContent = tabSize;
monacoEditor.updateOptions({ tabSize });

function updateTabSize(newSize) {
  tabSize = Math.min(10, Math.max(1, newSize));
  tabSizeValue.textContent = tabSize;
  localStorage.setItem("tabSize", tabSize);
  monacoEditor.updateOptions({ tabSize });

  tabSizeDecrease.classList.toggle("disabled", tabSize <= 1);
  tabSizeIncrease.classList.toggle("disabled", tabSize >= 10);

  updateStatusBar?.();
}

updateTabSize(tabSize);

tabSizeDecrease.addEventListener("click", () => updateTabSize(tabSize - 1));
tabSizeIncrease.addEventListener("click", () => updateTabSize(tabSize + 1));

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
  customContextMenu.style.display = "none";
  tabContextMenu.style.display = "none";
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

  const topTheme = changeBtnRect.top - 5;
  const topRecent = recentBtnRect.top - 5;

  themeMenu.style.top = `${topTheme}px`;
  themeMenu.style.maxHeight = `${window.innerHeight - topTheme}px`;

  recentMenu.style.top = `${topRecent}px`;
  recentMenu.style.maxHeight = `${window.innerHeight - topRecent}px`;
}
window.addEventListener("resize", () => {
  updateMenuPositions();

  // update editor padding
  const editorHeight = editor.clientHeight;
  monacoEditor.updateOptions({
    padding: {
      top: 12,
      bottom: editor.clientHeight / 2,
    },
  });
});
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

async function applyCustomThemeCSS(themeName) {
  const themes = await window.electronAPI.getCustomThemes();
  const filePath = themes[themeName];

  if (currentWatchedCssFile && currentWatchedCssFile !== filePath) {
    window.electronAPI.unwatchCssFile(currentWatchedCssFile);
  }

  if (filePath) {
    try {
      const cssContent = await window.electronAPI.readCssFile(filePath);
      if (cssContent) {
        const existingStyle = document.getElementById("custom-theme-style");
        if (existingStyle) existingStyle.remove();

        const styleTag = document.createElement("style");
        styleTag.id = "custom-theme-style";
        styleTag.textContent = cssContent;
        document.head.appendChild(styleTag);

        currentWatchedCssFile = filePath;
        window.electronAPI.watchCssFile(filePath); // start watching file

        return true;
      }
    } catch (error) {
      console.error("Failed to apply custom theme:", error);
    }
  }

  console.log("Theme not found:", themeName);
  return false;
}

async function applyTheme(theme) {
  const themes = await window.electronAPI.getCustomThemes();

  // set to dark if custom theme file doesn't exist
  if (!["dark", "onyx", "ash"].includes(theme) && !themes[theme]) {
    theme = "dark";
    currentTheme = "dark";
    localStorage.setItem("theme", theme);
  }

  // override with custom theme if selected
  if (!["dark", "onyx", "ash"].includes(theme)) {
    const success = await applyCustomThemeCSS(theme);
    if (!success) {
      return;
    }
  } else {
    // delete style tag
    const existingStyle = document.getElementById("custom-theme-style");
    if (existingStyle) {
      existingStyle.remove();
    }
  }

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

  monaco.editor.defineTheme("custom-theme", createCustomTheme());
  monaco.editor.setTheme("custom-theme");
}

// theme button click & update button checkmark
function updateActiveButton() {
  const allThemeButtons = themeMenu.querySelectorAll("button[data-theme]");
  allThemeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-theme") === currentTheme);
  });
}

// theme button click event
function attachThemeButtonEvents() {
  const allThemeButtons = themeMenu.querySelectorAll("button[data-theme]");
  allThemeButtons.forEach((btn) => {
    btn.removeEventListener("click", handleThemeButtonClick);
    btn.addEventListener("click", handleThemeButtonClick);
  });
}

async function handleThemeButtonClick(event) {
  const theme = event.currentTarget.getAttribute("data-theme");
  currentTheme = theme;
  localStorage.setItem("theme", theme);
  await applyTheme(theme);
  updateActiveButton();
}

// load custom theme and add to menu
async function addCustomThemesToMenu() {
  const customThemes = await window.electronAPI.getCustomThemes();
  const themeNames = Object.keys(customThemes);

  if (themeNames.length > 0) {
    const hr = document.createElement("div");
    hr.className = "hr";
    themeMenu.appendChild(hr);

    themeNames.forEach((themeName) => {
      // snake-case -> "Title Case"
      const displayName = themeName
        .replace(/[-_/]+/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

      const button = document.createElement("button");
      button.dataset.theme = themeName;
      button.innerHTML = `<span>${displayName}</span>
            <svg
              class="checkmark"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 10.23 7.15"
              style="width: 13px; height: 13px; stroke: #fff; fill: none"
            >
              <polyline
                points=".5 3.58 3.58 6.65 9.73 .5"
                style="fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round"
              />
            </svg>`;
      themeMenu.appendChild(button);
    });

    attachThemeButtonEvents();
    updateActiveButton();
  }
}

await applyTheme(currentTheme);
await addCustomThemesToMenu(); // load custom theme first
updateActiveButton();
attachThemeButtonEvents();

// apply css file update
window.electronAPI.onCssFileUpdated(async (path) => {
  if (currentWatchedCssFile === path && currentTheme) {
    console.log("Detected CSS update, reapplying theme...");
    await applyTheme(currentTheme);
  }
});

document.getElementById("openFileBtn").addEventListener("click", openFile);
document.getElementById("saveFileBtn").addEventListener("click", saveFile);
document.getElementById("saveAsFileBtn").addEventListener("click", saveAsFile);
document.getElementById("toggleStatusBar").addEventListener("click", toggleStatusBar);

// print button
document.getElementById("print-button").addEventListener("click", () => {
  const content = monacoEditor.getValue();
  const fontFamily = monacoEditor.getRawOptions().fontFamily || "Consolas";
  window.electronAPI.printContent({ text: content, fontFamily });
});

// about button
document.getElementById("aboutBtn").addEventListener("click", () => {
  confirmBox.style.display = "flex";
  about.style.display = "flex";
  isModalDisplayed = true;
});

document.getElementById("about-close").addEventListener("click", () => {
  confirmBox.style.display = "none";
  about.style.display = "none";
  isModalDisplayed = false;
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
  setTimeout(() => monacoEditor.focus(), 0);
};
// new tab button
newTabBtn.addEventListener("click", (e) => {
  e.preventDefault();
  createTab();
  switchTab(tabData.at(-1));
  setTimeout(() => monacoEditor.focus(), 0);
});

// tabs hover state
tabsContainer.addEventListener("mouseover", (e) => {
  tabAreaHovered = true;

  const hoveredTab = e.target.closest(".tab");
  if (hoveredTab) {
    const allTabs = tabs.querySelectorAll(".tab");
    isHoveringLastTab = hoveredTab === allTabs[allTabs.length - 1];
  } else {
    isHoveringLastTab = false;
  }
});
function handleTabsMouseLeave() {
  tabAreaHovered = false;
  isHoveringLastTab = false;
  fixedTabsWidth = null;
  tabs.style.maxWidth = "";
}
function isMouseInsideTabsContainer() {
  const rect = tabsContainer.getBoundingClientRect();
  return mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom;
}
tabsContainer.addEventListener("mouseleave", () => {
  handleTabsMouseLeave();
});
// detect if cursor is in tabsContainer even without cursor movement
document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (tabAreaHovered && !isMouseInsideTabsContainer()) handleTabsMouseLeave();
});
// enable tabs scroll x
tabs.addEventListener(
  "wheel",
  (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      tabs.scrollLeft += e.deltaY;
    }
  },
  { passive: false }
);

// new window button
newWindowBtn.addEventListener("click", () => {
  window.electronAPI.createNewWindow();
});

// file drag & drop
window.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (isModalDisplayed) {
    e.dataTransfer.dropEffect = "none";
    return;
  }

  if (!e.dataTransfer.types.includes("Files")) return;

  if (fileDropBox.style.display !== "flex") {
    fileDropBox.style.display = "flex";
    fileDrop.style.display = "flex";
  }
});

window.addEventListener("dragleave", (e) => {
  e.preventDefault();
  if (isModalDisplayed) {
    e.dataTransfer.dropEffect = "none";
    return;
  }

  fileDropBox.style.display = "none";
  fileDrop.style.display = "none";
});

window.addEventListener("drop", async (e) => {
  e.preventDefault();
  if (isModalDisplayed) {
    e.dataTransfer.dropEffect = "none";
    return;
  }

  fileDropBox.style.display = "none";
  fileDrop.style.display = "none";

  if (!e.dataTransfer.files.length) return;

  const file = e.dataTransfer.files[0];
  if (!file) return;

  const filePath = await window.electronAPI.getPathForFile(file);
  if (!filePath) {
    console.error("Failed to get file path.");
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
    settingsMenu.style.height = "calc(100vh - 35px - 25px)";
  } else {
    statusBar.style.display = "none";
    checkmark.style.display = "none";
    editor.style.height = "calc(100vh - 35px)";
    settingsMenu.style.height = "calc(100vh - 35px)";
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

  const selectedCharCount = model.getValueLengthInRange(monacoEditor.getSelection());
  const selectionText =
    selectedCharCount > 0 ? ` ${i18next.t("statusBar.selection", { count: selectedCharCount })}` : "";

  statusLeft.textContent = currentFilePath;
  statusLeft.title = currentFilePath;
  lineColEl.textContent = `${i18next.t("statusBar.line")} ${position.lineNumber}, ${i18next.t("statusBar.col")} ${
    position.column
  }${selectionText}`;
  zoomLevelEl.textContent = `${Math.round((fontSize / persistentFontSize) * 100)}%`;
  lineEndingEl.textContent = lineEnding;
  encodingEl.textContent = currentEncoding;
  encodingEl.title =
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
    tab.style.transition = "none";
    tab.style.position = "relative";
    tab.classList.add("tab-dragging");

    monacoEditor.updateOptions({ renderLineHighlight: "none" });
    monacoEditor.getDomNode().querySelector(".cursor").style.display = "none";

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
        monacoEditor.getDomNode()?.blur();
        switchTab(currentTab, true);

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
        monacoEditor.getDomNode()?.blur();
        switchTab(currentTab, true);

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
    draggingTab.style.position = "";
    draggingTab.style.pointerEvents = "";
    tab.classList.remove("tab-dragging");
    draggingTab = null;
    dragIndex = -1;
    monacoEditor.updateOptions({ renderLineHighlight: settings.lineHighlight ? "line" : "none" });
    monacoEditor.getDomNode().querySelector(".cursor").style.display = "";
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// create tab
function createTab(name, content = "", path = null) {
  if (!name) name = `${i18next.t("file.untitled")}.txt`;

  // reset tabs max width
  fixedTabsWidth = null;
  tabs.style.maxWidth = "";

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
    isFileSaved: true,
  };
  tabData.push(data);

  close.onclick = async (e) => {
    e.stopPropagation();

    if (tabAreaHovered && !isHoveringLastTab) {
      // set current tabs width - current tab width to tabs max width before closing tab
      const currentTabsWidth = tabs.offsetWidth;
      const tabWidth = tab.offsetWidth;
      fixedTabsWidth = currentTabsWidth - tabWidth;
      tabs.style.maxWidth = fixedTabsWidth + "px";
    } else if (tabAreaHovered && isHoveringLastTab) {
      // keep max width when last tab is closed
      fixedTabsWidth = tabs.offsetWidth;
      tabs.style.maxWidth = fixedTabsWidth + "px";
    }

    await attemptCloseTab(data);

    // update tabscontainer client rect
    if (tabAreaHovered && !isMouseInsideTabsContainer()) {
      handleTabsMouseLeave();
    }
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

    if (!data.isFileSaved) {
      const message = confirmSave.querySelector("p");

      message.textContent = i18next.t("modal.saveChanges", { name: data.name });
      confirmBox.style.display = "flex";
      confirmSave.style.display = "flex";
      isModalDisplayed = true;

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

            // reset max width when last tab is closed
            fixedTabsWidth = null;
            tabs.style.maxWidth = "";

            switchTab(tabData[0]);
            setTimeout(() => monacoEditor?.focus(), 0);
          }
        } else {
          const currentActive = tabData.find((t) => t.element.classList.contains("active"));
          if (currentActive) {
            document.querySelectorAll(".tab").forEach((tab) => {
              tab.classList.remove("prev-active");
            });

            const prev = currentActive.element.previousElementSibling;
            if (prev && prev.classList.contains("tab")) {
              prev.classList.add("prev-active");
            }
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
        isModalDisplayed = false;
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
        isModalDisplayed = false;
        actuallyCloseTab();
        removeListeners();
        resolve("closed");
      };

      const onCancel = () => {
        confirmBox.style.display = "none";
        confirmSave.style.display = "none";
        isModalDisplayed = false;
        removeListeners();
        monacoEditor?.focus();
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

        // reset max width when last tab is closed
        fixedTabsWidth = null;
        tabs.style.maxWidth = "";

        switchTab(tabData[0]);
        setTimeout(() => monacoEditor?.focus(), 0);
      }
    } else {
      const currentActive = tabData.find((t) => t.element.classList.contains("active"));
      if (currentActive) {
        document.querySelectorAll(".tab").forEach((tab) => {
          tab.classList.remove("prev-active");
        });

        const prev = currentActive.element.previousElementSibling;
        if (prev && prev.classList.contains("tab")) {
          prev.classList.add("prev-active");
        }
      }
    }

    resolve("closed");
  });
}

// close window
function attemptCloseWindow() {
  const hasUnsavedTabs = tabData.some((tab) => !tab.isFileSaved);
  if (!hasUnsavedTabs) {
    window.electronAPI.closeWindow();
    return;
  }

  confirmBox.style.display = "flex";
  confirmWindow.style.display = "flex";
  isModalDisplayed = true;

  const removeListeners = () => {
    saveAllBtn.removeEventListener("click", onSaveAll);
    discardAllBtn.removeEventListener("click", onDiscardAll);
    cancelAllBtn.removeEventListener("click", onCancelAll);
  };

  const closeConfirm = () => {
    confirmBox.style.display = "none";
    confirmWindow.style.display = "none";
    isModalDisplayed = false;
  };

  const onSaveAll = async () => {
    closeConfirm();

    const cancelledTabs = [];

    const allTabs = [...tabData];

    for (const tab of allTabs) {
      switchTab(tab);

      if (!tab.isFileSaved) {
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
    monacoEditor?.focus();
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
  }

  fontSize = data.fontSize || persistentFontSize; // font size for each tabs
  monacoEditor.updateOptions({ fontSize });
  isWordWrapOn = data.wordWrap ?? true;
  isMarkdownOn = data.isMarkdown ?? false;
  monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "bounded" : "off" });
  const model = monacoEditor.getModel();
  monaco.editor.setModelLanguage(model, isMarkdownOn ? "markdown" : "monapad");

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
  monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "bounded" : "off" });
  const wrapBtn = document.querySelector('button[data-action="wordWrap"] svg.checkmark');
  if (wrapBtn) wrapBtn.style.display = isWordWrapOn ? "inline-block" : "none";

  // restore Markdown state
  isMarkdownOn = data.isMarkdown ?? false;
  monaco.editor.setModelLanguage(monacoEditor.getModel(), isMarkdownOn ? "markdown" : "monapad");
  if (isMarkdownOn) {
    applyDecorations();
  }
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
    targetTab.element.querySelector(".name").classList.add("warn");
    reloadButton(targetTab, null, "remove");
  } else if (eventType === "change") {
    // if file is changed
    targetTab.element.querySelector(".name").classList.remove("warn");
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

  const nameEl = targetTab.element.querySelector(".name");

  if (content === null) {
    // line-through name if file is not found. remove reload button
    nameEl.classList.add("warn");
    reloadButton(targetTab, null, "remove");
    return;
  }

  // remove line-through if file is found
  nameEl.classList.remove("warn");

  if (targetTab.isFileSaved && (content === targetTab._lastExternalContent || content === targetTab.originalContent)) {
    reloadButton(targetTab, null, "remove");
    return;
  }

  // if file modified externally, add reload button and let user to decide to update or not.
  if (targetTab !== currentTab) switchTab(targetTab);
  showMessage("file-modified");
  console.log("handleFileChange: file modified externally. showing reload button");
  reloadButton(targetTab, filePath, "add");
}

function applyFileContentToEditor(tab, content) {
  tab._lastExternalContent = content;
  tab.originalContent = content;
  tab.isFileSaved = true;

  if (tab !== currentTab) switchTab(tab);

  const pos = monacoEditor.getPosition();
  monacoEditor.setValue(content);
  if (pos) monacoEditor.setPosition(pos);

  const close = tab.element.querySelector(".close");
  if (close) close.classList.remove("show-unsaved");

  updateStatusBar();
  applyDecorations();
  showMessage("file-updated");
  reloadButton(tab, null, "remove");
  console.log("handleFileChange: content updated");
}

function reloadButton(tab, filePath, mode) {
  const existing = tab.element.querySelector(".reload-button");

  if (mode === "remove") {
    if (existing) existing.remove();
    tab.element.classList.remove("has-reload-button");
    return;
  }

  if (mode === "add") {
    if (existing) return; // already exists

    const button = document.createElement("button");
    button.classList.add("reload-button");
    tab.element.classList.add("has-reload-button");
    button.title = "Update file and apply external changes";
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17">
        <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"
          d="M16.43,9.54c-.57,4.38-4.59,7.47-8.97,6.89C3.08,15.86,0,11.84.57,7.46.99,4.22,3.34,1.57,6.51.76c3.9-1,7.94,1.01,9.43,4.75"/>
        <path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"
          d="M16.5.5v5h-5"/>
      </svg>
    `;
    button.onclick = async () => {
      const content = await window.electronAPI.readFile(filePath);
      if (tab !== currentTab) switchTab(tab);
      applyFileContentToEditor(tab, content);
      reloadButton(tab, null, "remove");
    };

    const nameEl = tab.element.querySelector(".name");
    if (nameEl) nameEl.insertBefore(button, nameEl.firstChild);
  }
}

// open file
async function openFile() {
  const filePath = await window.electronAPI.openFileDialog();
  if (!filePath) return;
  await loadFileByPath(filePath);
}

window.electronAPI.onOpenFile(async (filePath) => {
  try {
    await loadFileByPath(filePath);
    console.log("File opened successfully via association:", filePath);
    window.electronLog.info("File opened successfully via association:", filePath);
  } catch (error) {
    console.error("Failed to open file via association:", error);
    window.electronLog.error("Failed to open file via association:", error);
  }
});

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
  if (content === null || content === undefined) {
    // alert("Failed to read file.");
    console.error("Failed to read file.");
    return;
  }

  const isMarkdownFile = /\.(md|markdown)$/i.test(filePath);

  if (tabData.length === 1) {
    const singleTab = tabData[0];
    const currentContent = monacoEditor ? monacoEditor.getValue() : "";
    if (!singleTab.content.trim() && !currentContent.trim()) {
      singleTab.name = filePath.split(/[/\\]/).pop();
      singleTab.content = content;
      singleTab._lastExternalContent = content;
      singleTab.path = filePath;
      singleTab.originalContent = content;
      singleTab.isFileSaved = true;
      singleTab.isMarkdown = isMarkdownFile;

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
  newTabData.isFileSaved = true;
  newTabData.isMarkdown = isMarkdownFile;

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

  // disable button when no recently opened files
  if (displayEntries.length === 0) {
    openRecentBtn.classList.add("disabled");
    recentMenu.style.display = "none";
    return;
  }
  openRecentBtn.classList.remove("disabled");

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
  clearButton.textContent = i18next.t("menu.clearHistory");
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
    active.isFileSaved = true;
    active._lastExternalContent = content;

    currentFilePath = filePath;
    updateStatusBar();

    const activeClose = active.element.querySelector(".close");
    if (activeClose) activeClose.classList.remove("show-unsaved");
    reloadButton(active, null, "remove");
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

  if (active.isFileSaved && !active.element.querySelector(".name")?.classList.contains("warn")) {
    console.log("No changes to save.");
    return true;
  }

  const content = monacoEditor.getValue();
  const result = await window.electronAPI.saveToFile(active.path, content);
  if (result.success) {
    console.log("File saved successfully");

    // udpate unsaved indicator when saved
    active.originalContent = content;
    active.isFileSaved = true;
    active._lastExternalContent = content;

    const activeSaveClose = active.element.querySelector(".close");
    if (activeSaveClose) activeSaveClose.classList.remove("show-unsaved");
    reloadButton(active, null, "remove");
    showMessage("file-saved");
  } else {
    console.error("Failed to save file:", result.error);
    if (result.error.includes("EPERM")) {
      return await saveAsFile();
    }
  }
}

// file saved & file already opened message
const messageQueue = [];
let isShowingMessage = false;
let isWindowFocused = true; // default is focused

function showMessage(id) {
  messageQueue.push(id);
  if (!isShowingMessage && isWindowFocused) {
    processQueue();
  }
}

function processQueue() {
  if (messageQueue.length === 0) {
    isShowingMessage = false;
    return;
  }
  if (!isWindowFocused) {
    isShowingMessage = false; // stop process when not focused
    return;
  }
  isShowingMessage = true;
  const id = messageQueue.shift();
  const el = document.getElementById(id);
  if (!el) {
    processQueue(); // go next when no element
    return;
  }
  el.classList.add("show");
  const duration = id === "file-updated" ? 2500 : 1500;
  setTimeout(() => {
    el.classList.remove("show");
    processQueue();
  }, duration);
}

// get forcus state
window.electronAPI.onWindowFocus((focused) => {
  isWindowFocused = focused;
  if (focused && messageQueue.length > 0 && !isShowingMessage) {
    processQueue();
  }
});

// Tab context menu handler
document.addEventListener("contextmenu", (e) => {
  const tabElement = e.target.closest(".tab");
  if (!tabElement) return;

  e.preventDefault();
  rightClickedTab = tabData.find((t) => t.element === tabElement);
  if (!rightClickedTab) return;

  // Hide editor context menu
  customContextMenu.style.display = "none";

  // Update copy & open path button
  updateTabContextMenuState(tabContextMenu, rightClickedTab);

  // menu position
  tabContextMenu.style.display = "block";
  tabContextMenu.style.visibility = "hidden";

  const menuWidth = tabContextMenu.offsetWidth;
  const menuHeight = tabContextMenu.offsetHeight;
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

  tabContextMenu.style.left = `${left}px`;
  tabContextMenu.style.top = `${top}px`;
  tabContextMenu.style.visibility = "visible";
  tabContextMenu.style.display = "flex";
});

// update copy & open path button based on path existance
function updateTabContextMenuState(menu, tab) {
  const copyPathBtn = menu.querySelector('[data-action="copyPath"]');
  const openPathBtn = menu.querySelector('[data-action="openPath"]');

  const hasPath = tab && tab.path;

  if (copyPathBtn) {
    copyPathBtn.classList.toggle("disabled", !hasPath);
  }

  if (openPathBtn) {
    openPathBtn.classList.toggle("disabled", !hasPath);
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
tabContextMenu.addEventListener("click", async (e) => {
  const action = e.target.closest("button")?.dataset.action;
  if (!action || !rightClickedTab) return;

  const targetTab = rightClickedTab;

  tabContextMenu.style.display = "none";
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
      const savedTabs = tabData.filter((t) => t.isFileSaved);
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

  tabContextMenu.style.display = "none";
  rightClickedTab = null;

  customContextMenu.style.display = "block";
  customContextMenu.style.visibility = "hidden";

  const menuWidth = customContextMenu.offsetWidth;
  const menuHeight = customContextMenu.offsetHeight;
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

  customContextMenu.style.left = `${left}px`;
  customContextMenu.style.top = `${top}px`;
  customContextMenu.style.visibility = "visible";
  customContextMenu.style.display = "flex";
});

// editor context menu click handler
customContextMenu.addEventListener("click", async (e) => {
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
      monacoEditor.updateOptions({ wordWrap: isWordWrapOn ? "bounded" : "off" });
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
      monaco.editor.setModelLanguage(model, isMarkdownOn ? "markdown" : "monapad");
      applyDecorations();
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
    customContextMenu.style.display = "none";
  }, 0);
});

// keep focus on editor when context menu is opened
customContextMenu.addEventListener("mousedown", (e) => {
  e.preventDefault();
});

// font & layout menu display
settingsButton.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsMenu.style.display = "block";
  menu.style.display = "none";
  menuButton.style.pointerEvents = "auto";
});
editor.addEventListener("click", () => {
  settingsMenu.style.display = "none";
});
settingsMenu.addEventListener("click", (e) => {
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

  // Ctrl + 1-9
  if (e.ctrlKey && /^Digit[1-9]$/.test(e.code)) {
    e.preventDefault();
    const index = parseInt(e.code.slice(-1), 10) - 1;
    if (tabData[index] && tabData[index] !== currentTab) {
      switchTab(tabData[index]);
    }
  }

  // Ctrl + Tab
  if (e.ctrlKey && e.code === "Tab") {
    e.preventDefault();
    if (!currentTab) return;
    const currentIndex = tabData.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabData.length;
    switchTab(tabData[nextIndex]);
  }
});
