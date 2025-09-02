#!/usr/bin/env node

/**
 * @file A CLI tool to convert a Material Design theme JSON file into CSS custom properties.
 * It processes both light and dark schemes, converts HEX colors to their R, G, B values,
 * and generates tonal palettes for key colors.
 *
 * @author Your Name or Username
 * @version 1.0.0
 */

// -----------------------------------------------------------------------------
// Section: Imports
// -----------------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const chroma = require('chroma-js');
const { Command } = require('commander');

// -----------------------------------------------------------------------------
// Section: Constants & Configuration
// -----------------------------------------------------------------------------

/**
 * An array of theme color roles that should not have a tonal palette generated.
 * These are typically neutral or surface colors that don't vary by tone.
 * @type {string[]}
 */
const KEYS_TO_SKIP = [
  'background', 'surface', 'surfaceTint', 'shadow', 'scrim',
  'outline', 'outlineVariant', 'surfaceDim', 'surfaceBright'
];

// -----------------------------------------------------------------------------
// Section: Helper Functions
// -----------------------------------------------------------------------------

/**
 * Converts a HEX color string to a comma-separated R, G, B value string.
 * Handles 3-digit and 6-digit hex codes, with or without a leading '#'.
 *
 * @param {string} hex - The hexadecimal color string (e.g., '#FF5733' or 'F53').
 * @returns {string} The R, G, B values as a string (e.g., '255, 87, 51'). Returns '0, 0, 0' on error.
 */
function hexToRgbValues(hex) {
  if (!hex || typeof hex !== 'string') return '0, 0, 0';

  let cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }

  if (cleanHex.length !== 6) {
    return '0, 0, 0';
  }

  try {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  } catch (error) {
    return '0, 0, 0';
  }
}

/**
 * Generates a full tonal palette (shades 50-950) from a single base color.
 * The base color is assumed to be the '100' shade in the new palette.
 * Uses chroma-js for color manipulation.
 *
 * @param {string} baseColorHex - The base HEX color to generate the palette from.
 * @returns {Object<number, string>|null} An object mapping shade numbers to HEX color strings, or null on error.
 */
function createTonalPaletteFrom100(baseColorHex) {
  const palette = {};
  try {
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const lighterShade = chroma.scale(['#FFFFFF', baseColorHex]).mode('lch').colors(3)[1];
    const darkerShades = chroma.scale([baseColorHex, '#09090b']).mode('lch').padding([0.1, 0.25]).colors(10).slice(1);

    const generatedColors = [lighterShade, baseColorHex, ...darkerShades];
    shades.forEach((shade, index) => {
      palette[shade] = generatedColors[index];
    });
  } catch (error) {
    console.error(`Error generating palette for ${baseColorHex}:`, error);
    return null;
  }
  return palette;
}

/**
 * Converts a string from camelCase to kebab-case.
 * e.g., 'primaryContainer' becomes 'primary-container'.
 *
 * @param {string} str - The input string in camelCase.
 * @returns {string} The converted string in kebab-case.
 */
function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// -----------------------------------------------------------------------------
// Section: Main CLI Logic
// -----------------------------------------------------------------------------

// Initialize the command-line interface program.
const program = new Command();

program
  .version('1.0.0', '-v, --version', 'Output the current version')
  .description('A CLI to convert a Material Design theme JSON into CSS RGB variables.')
  .requiredOption('-i, --input <file>', 'Source JSON theme file to process')
  .option('-o, --output <file>', 'Output CSS file name (optional)')
  .action((options) => {
    // This is the main execution block that runs when the command is invoked.

    // 1. Determine input and output file paths.
    const inputFile = options.input;
    // If no output file is specified, create a default name based on the input file.
    // e.g., 'my-theme.json' -> 'my-theme-rgb.css'
    const outputCssFile = options.output || `${path.basename(inputFile, '.json')}-rgb.css`;

    console.log(`🚀 Starting theme conversion...`);
    console.log(`   > Input : ${inputFile}`);
    console.log(`   > Output: ${outputCssFile}`);

    try {
      // 2. Read and parse the source JSON file.
      const inputPath = path.resolve(process.cwd(), inputFile);
      const schemes = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

      // Arrays to hold the generated CSS lines.
      const cssRawVarsOutput = [];
      const themeRegistrationOutput = ['@theme {'];

      // --- Process Light Scheme ---
      cssRawVarsOutput.push('/* ================================================================== */');
      cssRawVarsOutput.push(`/* MATERIAL DESIGN COLOR TOKENS (LIGHT & DARK)                  */`);
      cssRawVarsOutput.push('/* ================================================================== */\n');
      cssRawVarsOutput.push(':root {');

      for (const role in schemes.light) {
        const colorHex = schemes.light[role];
        const roleKebab = toKebabCase(role);
        const colorRgbValues = hexToRgbValues(colorHex);

        cssRawVarsOutput.push(`\n  /* --- ${roleKebab.replace(/-/g, ' ')} --- */`);
        cssRawVarsOutput.push(`  --md-sys-color-${roleKebab}: ${colorRgbValues}; /* Locked Color */`);

        themeRegistrationOutput.push(`\n  /* ${roleKebab.replace(/-/g, ' ')} */`);
        themeRegistrationOutput.push(`  --color-${roleKebab}: var(--md-sys-color-${roleKebab}); /* Locked Color */`);

        if (!KEYS_TO_SKIP.includes(role)) {
          const newPalette = createTonalPaletteFrom100(colorHex);
          if (newPalette) {
            for (const shade in newPalette) {
              const shadeHex = newPalette[shade];
              const shadeRgbValues = hexToRgbValues(shadeHex);
              cssRawVarsOutput.push(`  --md-sys-color-${roleKebab}-${shade}: ${shadeRgbValues};`);
              themeRegistrationOutput.push(`  --color-${roleKebab}-${shade}: var(--md-sys-color-${roleKebab}-${shade});`);
            }
          }
        }
      }
      cssRawVarsOutput.push('}\n');

      // --- Process Dark Scheme ---
      cssRawVarsOutput.push('@media (prefers-color-scheme: dark) {');
      cssRawVarsOutput.push('  :root {');
      for (const role in schemes.dark) {
        const colorHex = schemes.dark[role];
        const roleKebab = toKebabCase(role);
        const colorRgbValues = hexToRgbValues(colorHex);

        cssRawVarsOutput.push(`\n    /* --- ${roleKebab.replace(/-/g, ' ')} --- */`);
        cssRawVarsOutput.push(`    --md-sys-color-${roleKebab}: ${colorRgbValues}; /* Locked Color */`);

        if (!KEYS_TO_SKIP.includes(role)) {
          const newPalette = createTonalPaletteFrom100(colorHex);
          if (newPalette) {
            for (const shade in newPalette) {
              const shadeHex = newPalette[shade];
              const shadeRgbValues = hexToRgbValues(shadeHex);
              cssRawVarsOutput.push(`    --md-sys-color-${roleKebab}-${shade}: ${shadeRgbValues};`);
            }
          }
        }
      }
      cssRawVarsOutput.push('  }');
      cssRawVarsOutput.push('}\n');

      themeRegistrationOutput.push('}');

      // 3. Assemble the final CSS output string.
      const finalCssOutput = [
        ...cssRawVarsOutput,
        '/* ================================================================== */',
        '/* TOKEN REGISTRATION FOR TAILWIND v4 @theme                    */',
        '/* ================================================================== */',
        ...themeRegistrationOutput
      ];

      // 4. Write the result to the output file.
      const outputPath = path.resolve(process.cwd(), outputCssFile);
      fs.writeFileSync(outputPath, finalCssOutput.join('\n'), 'utf8');

      console.log(`\n✨ Success! CSS file has been saved to: ${outputCssFile}`);

    } catch (error) {
      console.error('\n❌ An error occurred:', error.message);
      // Exit with a non-zero code to indicate failure, useful for scripting.
      process.exit(1);
    }
  });

// Parse the command-line arguments and execute the action.
// This is the entry point of the CLI tool.
program.parse(process.argv);