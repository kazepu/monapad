# How to Setup Custom Theme

Monapad supports custom themes that allow you to personalize the appearance of the app.

To use a custom theme, place a `.css` file inside the **themes folder**, usually located at: `
%APPDATA%\monapad\themes`  
You can also open the themes folder directly from the settings in the app.

Once the CSS file is added, it will appear in the theme selection menu with file name within Monapad.  
**Note:** You must reload the app (press `Ctrl + R`) for the new theme file to be recognized. After that, any changes to the theme file will be applied simply by saving the file

## Official Custom Themes (How to Submit)

Approved and community-submitted custom themes can be found in [README.md](https://github.com/sheetau/monapad/blob/main/README.md#custom-themes) or in the [official repository](https://github.com/sheetau/monapad/tree/main/customthemes).  
You can download and use any of these themes, or use them as a base to create your own.

If you create a decent quality theme, feel free to submit a pull request to the [repository](https://github.com/sheetau/monapad/tree/main/customthemes).  
Please create a folder contains following files for your theme inside the repository before submitting a pull request:

- `theme-name` (folder)
  - `theme-name.css`
  - `preview.png` (multiple images allowed)
  - `README.md` (include preview image and link to the CSS file)

Note: Theme filenames like `custom-theme_name.css` will be displayed in the menu as `Custom Theme Name`.

When submitting a pull request, prefix your PR title with `theme:`  
**Example:** `theme: Made Light theme`  
If approved, all users will be able to download and use it from the repository.

## Creating Your Own Theme

You can either edit the official custom themes, or open the developer tools with `Shift + Ctrl + I` and inspect elements as you create your own theme.  
Make sure to include at least the following variables:

```css
:root {
  --color1: #121214 !important; /* (dark theme) editor, modal background */
  --color2: #1a1a1e !important; /* (dark theme) toolbar, statusbar, menu, message background */
  --color3: #242429 !important; /* (dark theme) button hover, modal button */
  --editorText: #ffffff; /* text color */

  /* monaco editor color */
  /* 6 and 8 digit hex are allowed */
  --vscode-editor-background: var(--color1);
  --vscode-editor-foreground: var(--editorText);
  --vscode-editor-lineHighlightBackground: var(--color2);
  --vscode-editor-lineHighlightBorder: #00000000;
  --vscode-editorWidget-background: var(--color2);
  --vscode-editorHoverWidget-background: var(--color2);
  --vscode-quickInputList-focusBackground: var(--color3);
  --vscode-input-background: var(--color1);
  --vscode-list-activeSelectionBackground: var(--color3);
  --vscode-list-dropBackground: var(--color3);
  --vscode-menu-selectionBackground: var(--color3);
  --vscode-list-hoverBackground: var(--color3);
  --vscode-editorStickyScrollHover-background: var(--color3);
  --vscode-button-hoverBackground: var(--color3);
  --vscode-badge-background: var(--color3);
  --vscode-editorWidget-border: var(--color3);
  --vscode-editorHoverWidget-border: var(--color3);
}
```

Changing color can be done simply by redefining the default variables.  
You can refer to [this official theme](https://github.com/sheetau/monapad/tree/main/customthemes/ayu/Ayu.css) to see more in-depth how it's done.  
Below are all the default variables available for customization (redefine and use them within the `:root` selector):

### Monapad Theme Color Variables

#### Default Theme Color Variables

These are only used in CSS, so if you want more precise control, you can directly set colors on the elements themselves.

| Variable         | Description                                                                  |
| ---------------- | ---------------------------------------------------------------------------- |
| `--color1`       | Background of editor and modal (`!important` required)                       |
| `--color2`       | Background of toolbar, statusbar, menu, and messages (`!important` required) |
| `--color3`       | Hover color for buttons and modal buttons (`!important` required)            |
| `--editorText`   | Primary text color                                                           |
| `--btnHover`     | Button hover color in modals                                                 |
| `--highlight`    | Highlight color used across UI                                               |
| `--btnHighlight` | Highlight color for important buttons                                        |
| `--windowClose`  | Close button color                                                           |
| `--warn`         | Title color for deleted files                                                |

#### Monapad Syntax Highlighting

Use hex colors (6 digits), or variables that contain them.

| Variable           | Description                         |
| ------------------ | ----------------------------------- |
| `--heading1`       | Color for `# heading 1`             |
| `--heading2`       | Color for `## heading 2`            |
| `--heading3`       | Color for `### heading 3`           |
| `--bulletPoint`    | Color for `- bullet points`         |
| `--numberList`     | Color for `- numbered lists`        |
| `--subText`        | Color for `-# subtext`              |
| `--blockQuote`     | Color for `> blockquotes`           |
| `--inlineCode`     | Color for `` `inline code` ``       |
| `--codeBlockFence` | Color for code block fences (```)   |
| `--codeBlock`      | Color for the actual code in blocks |

You can specify font styles by adding a `Style` to each variable name.  
Supported styles are `bold`, `italic`, and `underline`.  
Use spaces to combine multiple styles like:

```css
--heading1Style: bold italic underline;
```

Also, the `.marker-transparent` class is used to adjust the opacity of some syntax markers, and the `.sub-text` class is used to adjust the opacity of full line of subtext.

### Monaco Editor Theme Color Variables

Use hex colors (6 or 8 digits), or variables that contain them.  
Refer to the VS Code theme color tokens in this document:  
https://code.visualstudio.com/api/references/theme-color#lists-and-trees

For example, use `--vscode-editor-background` to theme the `editor.background` token, like:

```css
--vscode-editor-background: #0b0e14;
--vscode-editor-foreground: #bfbdb6;
```

### Markdown Syntax Highlighting

Use hex colors (6 digits), or variables that contain them.  
These specify the syntax highlight colors used when Markdown mode is enabled.  
Refer to:  
https://github.com/trofimander/monaco-markdown/blob/master/src/ts/markdown.ts

For example, use `--md-string-link` to theme the `string.link` token.
