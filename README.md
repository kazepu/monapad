<p align="center">
  <img width="128" align="center" src="icon/favicon.ico">
</p>
<h1 align="center">
  Monapad
</h1>
<p align="center">
  A modern text editor that uses the same Monaco Editor as VSCode, offering a dark theme, tab support, and lightweight highlight features.
</p>

## Features:

Monapad is a modern text editor designed for efficient editing and readability, built on the Monaco Editor — the same core editor used in Visual Studio Code. Its key features include:

- A clean, modern dark theme-only interface for distraction-free writing.
- Smooth and responsive tab management, just like Chromium browser experience.
- Supports many of the same keyboard shortcuts and functionalities as VSCode.
- Special syntax highlighting:
  - Lines starting with `# ` and `## ` are highlighted.
  - Lines starting with `-# ` are shown in gray.
  - Lines starting with `- `, `* `, `+ ` and `Num. ` have their marker highlighted.
  - Lines starting with `> ` are shown in _italic_.
  - Text wrapped in single backticks `` `code` `` is highlighted as inline code.
  - Text wrapped in triple backticks ``` is highlighted as a code block.
- Supports [Custome CSS and Themes](https://github.com/sheetau/monapad/blob/main/CUSTOMTHEME.md)
- Syntax highlighting for Markdown.

Standard text editors can become hard to read when handling large documents, as all text often appears in the same color. Monapad was created to solve this by offering lightweight highlight features without fully relying on Markdown formatting. It also allows users to use familiar VSCode-style shortcuts and editing features.

The name "Monapad" combines Monaco (the editor engine) and Notepad, reflecting its purpose: a simple yet powerful editing experience. With support for text search and replace, multi-cursor editing, and essential editing operations, Monapad brings the familiarity of VSCode into a streamlined package.

![Screenshot Dark](screenshots/monapad_ss_dark.png?raw=true "Dark")
![Screenshot Ayu](customthemes/ayu/preview.png?raw=true "Ayu")

## Shortcuts:

- Ctrl+T to create new tab.
- Ctrl+Shift+T to reopen recently closed tab.
- Ctrl+W to close current tab.
- Ctrl+Tab to switch between tabs.
- Ctrl+Num(1-9) to quickly switch to specified tab.
- Ctrl+"+/-" or "mouse wheel" for zooming. Ctrl+"0" to reset zooming to default.
- Ctrl+Click to open link.
- F11 to toggle full screen.

For more editor shortcuts, please refer to the sections **Basic editing**, **Search and replace**, and **Multi-cursor and selection** in [this link](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf).

## Downloads:

Go to [Monapad Releases](https://github.com/sheetau/monapad/releases) and download the latest version of **Monapad-Setup-x.x.x.exe**.

> ⚠️ Since this app is not code-signed yet, Windows SmartScreen may show a warning when launching the installer, especially while the download count is still low.
> If you see the warning, click “More info” and then “Run anyway” to proceed with the installation.
> This is expected behavior and the warning will disappear over time as the app gains reputation.

## Custom Themes:

- [Ayu Theme](https://github.com/sheetau/monapad/tree/main/customthemes/ayu/README.md) [[sheeta](https://github.com/sheetau)]

To use custom themes, download CSS file from the above list or from [official repository](https://github.com/sheetau/monapad/tree/main/customthemes) and place it to themes folder that can be opened from the settings in the app.

Click [here](https://github.com/sheetau/monapad/blob/main/CUSTOMTHEME.md) To see how to setup and submit your own custom themes.

## Disclaimer and Privacy statement:

- Monapad does not and will never collect user information in terms of user privacy.
- No IP tracking.
- No recording, reading or sending of typings, file names or file paths.

Feel free to review the source code since it is 100% open sourced.

## Contributing:

- [Submit your custome themes](https://github.com/sheetau/monapad/blob/main/CUSTOMTHEME.md)
- [Internationalization and localization](https://github.com/sheetau/monapad/blob/main/LANGUAGE.md)
- Report bugs or submit feature requests [here](https://github.com/sheetau/monapad/issues).
- If you like my work, please consider:
  - Star this project on GitHub
  - [![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/sheeta)

## Dependencies and References:

- [Electron Builder](https://github.com/electron-userland/electron-builder)
- [Webpack](https://github.com/webpack/webpack)
- [Monaco Editor](https://github.com/microsoft/monaco-editor)

## Stay tuned 📢:

[Sheeta's Discord Server](https://discord.gg/2dXs5HwXuW)
