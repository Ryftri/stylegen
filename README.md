# StyleGen CLI

[![NPM Version](https://img.shields.io/npm/v/stylegen.svg)](https://www.npmjs.com/package/stylegen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful and simple CLI tool to convert Material Design theme JSON files into CSS custom properties with RGB values and tonal palettes. Perfect for integrating a design system's tokens into a web project.

## ✨ Features

-   Converts HEX color codes to comma-separated `R, G, B` values.
-   Generates a full tonal palette (shades 50-950) for primary, secondary, tertiary, and error colors.
-   Processes both `light` and `dark` color schemes automatically.
-   Creates CSS variables compatible with Tailwind CSS `@theme` registration.
-   Flexible input and output file options.

## 🚀 Installation

Install `stylegen` globally using NPM to use it anywhere on your system.

```bash
npm install -g stylegen
```

*(Note: The package name `stylegen` might be taken. Ensure you use your final package name if it's different)*

## Usage

The command is straightforward. You must provide an input file, and you can optionally specify an output file.

```bash
stylegen [options]
```

### Options

| Option                | Alias | Description                                               | Required |
| --------------------- | ----- | --------------------------------------------------------- | -------- |
| `--input <file>`      | `-i`  | Source JSON theme file to process.                        | Yes      |
| `--output <file>`     | `-o`  | Output CSS file name. (Defaults to `<input-name>-rgb.css`) | No       |
| `--version`           | `-v`  | Display the current version of the CLI.                   | No       |
| `--help`              | `-h`  | Display the help menu.                                    | No       |

### Example

1.  **Create a theme file** (e.g., `my-theme.json`):

    ```json
    {
      "light": {
        "primary": "#6750A4",
        "surface": "#FFFBFE"
      },
      "dark": {
        "primary": "#D0BCFF",
        "surface": "#1C1B1F"
      }
    }
    ```

2.  **Run the command:**

    ```bash
    stylegen --input my-theme.json --output ./src/styles/theme.css
    ```

3.  **The output** (`theme.css`) will be generated with all the necessary CSS variables, ready to be imported into your project.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
_Crafted with ❤️ by [Ryftri](https://github.com/Ryftri)_