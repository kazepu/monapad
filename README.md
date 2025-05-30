<p align="center">
  <img width="128" align="center" src="icon/favicon.ico">
</p>
<h1 align="center">
  Monapad
</h1>
<p align="center">
  A modern and minimalist text editor that uses the same Monaco Editor as VSCode, offering a dark theme, tab support, and lightweight highlight features.
</p>

## Features

Monapad is a modern text editor designed for simplicity and speed, built on the Monaco Editor — the same core editor used in Visual Studio Code. Its key features include:

- A clean, modern dark theme-only interface for distraction-free writing.
- Smooth and responsive tab management, similar to the Chromium browser experience.
- Supports many of the same keyboard shortcuts and functionalities as VSCode.
- Special line formatting:
  - Lines starting with `# ` are highlighted.
  - Lines starting with `-# ` are shown in gray.
- Built-in syntax highlighting for Markdown.

Standard text editors can become hard to read when handling large documents, as all text often appears in the same color. Monapad was created to solve this by offering lightweight highlight features without fully relying on Markdown formatting. It also allows users to use familiar VSCode-style shortcuts and editing features.

The name "Monapad" combines Monaco (the editor engine) and Notepad, reflecting its purpose: a simple yet powerful editing experience. With support for text search and replace, multi-cursor editing, and essential editing operations, Monapad brings the familiarity of VSCode into a streamlined package.

![Screenshot Dark](ScreenShots/1.png?raw=true "Dark")
![Screenshot Markdown](ScreenShots/2.png?raw=true "Markdown")
![Screenshot DiffViewer](ScreenShots/3.png?raw=true "DiffViewer")
![Screenshot Light](ScreenShots/4.png?raw=true "Light")

## Shortcuts:

- Ctrl+N/T to create new tab.
- Ctrl+(Shift)+Tab to switch between tabs.
- Ctrl+Num(1-9) to quickly switch to specified tab.
- Ctrl+"+"/"-" for zooming. Ctrl+"0" to reset zooming to default.
- Ctrl+L/R to change text flow direction. (LTR/RTL)
- Alt+P to toggle preview split view for Markdown file.
- Alt+D to toggle side-by-side diff viewer.

## Downloads:

Notepads is available in the Microsoft Store. You can get the latest version of Notepads here for free: [Microsoft Store Link](https://www.microsoft.com/store/apps/9nhl4nsc67wm).

You can also use the Windows Package Manager to install notepads:

```cmd
winget install "Notepads App"
```

## Changelog:

- [Notepads Releases](https://github.com/0x7c13/Notepads/releases)

## Disclaimer and Privacy statement:

To be 100% transparent:

- Notepads does not and will never collect user information in terms of user privacy.
- I will not track your IP.
- I will not record your typings or read any of your files created in Notepads including file name and file path.
- No typings or files will be sent to me or third parties.

I am using analytics service "AppCenter" to collect basic usage data plus some minimum telemetry to help me debug runtime errors. Here is the thread I made clear on this topic: https://github.com/0x7c13/Notepads/issues/334

Feel free to review the source code or build your own version of Notepads since it is 100% open sourced.

#### More to read here: [[Privacy Policy](PRIVACY.md)]

TL;DR: You might notice that I work for Microsoft but Notepads is my personal project that I accomplish during free time (to empower every person and every organization on the planet to achieve more😃). I do not work for the Windows team, nor do I work for a Microsoft UX/App team. I am not expert on creating Windows apps either. I learned how to code UWP as soon as I started this project, so don’t put too much hope on me or treat it as a project sponsored by Microsoft.

## Contributing:

- [How to contribute?](CONTRIBUTING.md)
- Notepads is free and open source, if you like my work, please consider:
  - Star this project on GitHub
  - Leave me a review [here](https://www.microsoft.com/store/apps/9nhl4nsc67wm)
  - [![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D6Y3C6)

## Dependencies and References:

- [Windows Community Toolkit](https://github.com/windows-toolkit/WindowsCommunityToolkit)
- [XAML Controls Gallery](https://github.com/microsoft/Xaml-Controls-Gallery)
- [Windows UI Library](https://github.com/Microsoft/microsoft-ui-xaml)
- [ColorCode Universal](https://github.com/WilliamABradley/ColorCode-Universal)
- [UTF Unknown](https://github.com/CharsetDetector/UTF-unknown)
- [DiffPlex](https://github.com/mmanela/diffplex)
- [Win2D](https://github.com/microsoft/Win2D)

## Special Thanks:

- [Yi Zhou](http://zhouyiwork.com/) - App icon designer, Notepads App Icon (old) is greatly inspired by the new icon for Windows Terminal.
- [Mahmoud Qurashy](https://github.com/mah-qurashy) - App icon and file icon(s) designer, creator of the new Notepads App Icon.

- Alexandru Sterpu - App Tester, who helped me a lot during preview/beta testing.
- Code Contributors: [DanverZ](https://github.com/chenghanzou), [BernhardWebstudio](https://github.com/BernhardWebstudio), [Csányi István](https://github.com/AmionSky), [Pavel Erokhin](https://github.com/MairwunNx), [Sergio Pedri](https://github.com/Sergio0694), [Lucas Pinho B. Santos](https://github.com/pinholucas), [Soumya Ranjan Mahunt](https://github.com/soumyamahunt), [Belleve Invis](https://github.com/be5invis), [Maickonn Richard](https://github.com/Maickonn), [Xam](https://github.com/XamDR)
- Documentation Contributors: [Craig S.](https://github.com/sercraig)
- Localization Contributors:

  - [fr-FR][French (France)]: [François Rousselet](https://github.com/frousselet), [François-Joseph du Fou](https://github.com/FJduFou), [Armand Delessert](https://github.com/ArmandDelessert)
  - [es-ES][Spanish (Spain)]: [Jose Pinilla](https://github.com/joseppinilla)
  - [zh-CN][Chinese (S)]: [lindexi](https://github.com/lindexi), [walterlv](https://github.com/walterlv), [0x7c13](https://github.com/0x7c13)
  - [hu-HU][Hungarian (Hungary)]: [Csányi István](https://github.com/AmionSky), [Kristóf Kékesi](https://github.com/KristofKekesi)
  - [tr-TR][Turkish (Turkey)]: [Mert Can Demir](https://github.com/validatedev), [Emirhakan Tanhan](https://github.com/EmirhakanTanhan)
  - [ja-JP][Japanese (Japan)]: [Mamoru Satoh](https://github.com/pnp0a03)
  - [de-DE][German (Germany)]/[de-CH][German (Switzerland)]: [Walter Wolf](https://github.com/WalterWolf49)
  - [ru-RU][Russian (Russia)]: [Pavel Erokhin](https://github.com/MairwunNx), [krlvm](https://github.com/krlvm)
  - [fi-FI][Finnish (Finland)]: [Esa Elo](https://github.com/sauihdik)
  - [uk-UA][Ukrainian (Ukraine)]: [Taras Fomin aka Tarik02](https://github.com/Tarik02)
  - [it-IT][Italian (Italy)]: [Andrea Guarinoni](https://github.com/guari), [Bunz](https://github.com/66Bunz)
  - [cs-CZ][Czech (Czech Republic)]: [Jan Rajnoha](https://github.com/JanRajnoha)
  - [pt-BR][Portuguese (Brazil)]: [Lucas Pinho B. Santos](https://github.com/pinholucas)
  - [ko-KR][Korean (Korea)]: [Donghyeok Tak](https://github.com/tdh8316)
  - [hi-IN][Hindi (India)]/[or-IN][Odia (India)]: [Soumya Ranjan Mahunt](https://github.com/soumyamahunt)
  - [pl-PL][Polish (Poland)]: [Daxxxis](https://github.com/Daxxxis)
  - [ka-GE][Georgian (Georgia)]: [guram mazanashvili](https://github.com/gmaza)
  - [hr-HR][Croatian (Croatia)]: [milotype](https://github.com/milotype)
  - [zh-TW][Chinese (T)]: [Tony Yao](https://github.com/SeaBao)
  - [pt-PT][Portuguese (Portugal)]: [O.Leitão](https://github.com/oleitao)
  - [sr-Latn][Serbian (Latin)]: [bzzrak](https://github.com/bzzrak)
  - [sr-cyrl][Serbian (Cyrillic)]: [bzzrak](https://github.com/bzzrak)
  - [nl-NL][Dutch (Netherlands)]: [Stephan Paternotte](https://github.com/Stephan-P)

- Notepads CI/CD pipeline: Built with ❤ by [Pipeline Foundation](https://pipeline.foundation)

[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/0)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/0)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/1)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/1)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/2)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/2)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/3)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/3)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/4)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/4)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/5)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/5)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/6)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/6)[![](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/images/7)](https://sourcerer.io/fame/0x7c13/0x7c13/Notepads/links/7)

## Stay tuned 📢:

- [Notepads Discord Server](https://discord.gg/VqetCub)
