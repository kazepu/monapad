<p align="center">
  <img width="128" align="center" src="icon/favicon.ico">
</p>
<h1 align="center">
  Monapad
</h1>
<p align="center">
  A modern and minimalist text editor that uses the same Monaco Editor as VSCode, offering a dark theme, tab support, and lightweight highlight features.
</p>

## Features:

Monapad is a modern text editor designed for simplicity and speed, built on the Monaco Editor — the same core editor used in Visual Studio Code. Its key features include:

- A clean, modern dark theme-only interface for distraction-free writing.
- Smooth and responsive tab management, similar to the Chromium browser experience.
- Supports many of the same keyboard shortcuts and functionalities as VSCode.
- Special line formatting:
  - Lines starting with `# ` and `## ` are highlighted.
  - Lines starting with `-# ` are shown in gray.
- Syntax highlighting for Markdown.

Standard text editors can become hard to read when handling large documents, as all text often appears in the same color. Monapad was created to solve this by offering lightweight highlight features without fully relying on Markdown formatting. It also allows users to use familiar VSCode-style shortcuts and editing features.

The name "Monapad" combines Monaco (the editor engine) and Notepad, reflecting its purpose: a simple yet powerful editing experience. With support for text search and replace, multi-cursor editing, and essential editing operations, Monapad brings the familiarity of VSCode into a streamlined package.

![Screenshot Dark](screenshots/monapad_ss.png?raw=true "Dark")
![Screenshot Onyx](screenshots/monapad_ss2.png?raw=true "Onyx")

## Shortcuts:

- Ctrl+T to create new tab.
- Ctrl+W to close current tab.
- Ctrl+Tab to switch between tabs.
- Ctrl+Num(1-9) to quickly switch to specified tab.
- Ctrl+"+/-" or "mouse wheel" for zooming. Ctrl+"0" to reset zooming to default.
- Ctrl+Click to open link.
- F11 to toggle full screen.

For more editor shortcuts, please refer to the sections **Basic editing**, **Search and replace**, and **Multi-cursor and selection** in [this link](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf).

## Downloads:

Go to [Monapad Releases](https://github.com/sheetau/monapad/releases) and download the latest version of **Monapad-Setup-1.0.1.exe**.

## Disclaimer and Privacy statement:

- Monapad does not and will never collect user information in terms of user privacy.
- No IP tracking.
- No recording, reading or sending of typings, file names or file paths.

Feel free to review the source code since it is 100% open sourced.

## Contributing:

Report bugs or submit feature requests [here](https://github.com/sheetau/monapad/issues).  
If you like my work, please consider:

- Star this project on GitHub
- [![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/sheeta)

Join [my discord server](https://discord.gg/2dXs5HwXuW) to stay tuned.

## Dependencies and References:

- [Electron Builder](https://github.com/electron-userland/electron-builder)
- [Webpack](https://github.com/webpack/webpack)
- [Monaco Editor](https://github.com/microsoft/monaco-editor)
