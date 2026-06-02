# ZenWriter — Distraction-Free Text Editor (Tauri 2)

A beautiful, minimalist, and distraction-free writing environment designed to help you focus. Built using **Tauri 2** (HTML/CSS/JS frontend and **Rust** backend), running natively on both **macOS** and **Windows**.

## Features

*   **Distraction-Free Mode**: All sidebar menus and status bars auto-fade to zero opacity the moment you begin typing, leaving only your text. Menus softly reappear when you stop typing or move the mouse.
*   **Interactive Visuals (Canvas)**: Background features floating stars, and typing triggers expanding ripple waves across the animated gradient background.
*   **Procedural Web Audio Engine**: Synthesizes immersive soundscapes in real-time without using heavy audio files:
    *   **Keystroke Profiles**: Choose between *Meccanica* (clicky mechanical switches), *Chiclet* (soft modern keys), or *Macchina da Scrivere* (heavy retro typewriter with an Enter bell).
    *   **Ambient Audio**: Procedural generator for *Pioggia Zen* (rain), *Vento* (wind), or *Mellow Chords* (lo-fi chords).
*   **Typography Customization**: Switch between *Modern* (Sans), *Classico* (Serif), and *Retro* (Mono) fonts, with inline font size controls (+ / —).
*   **Daily Goals & Session Stats**: Set target word goals with a live glowing progress bar, and view live statistics like session duration and WPM (Words Per Minute).
*   **Native File Dialog**: Save and export files easily as Markdown (`.md`) or plain text (`.txt`) via native OS file saving dialogues.
*   **Automated Cloud Releases**: Pre-compiled binaries for Windows (`.msi` / `.exe`) and macOS (`.dmg`) are automatically generated and uploaded to GitHub Releases using GitHub Actions.

## Project Structure

*   `src/`: Frontend interface (Vanilla HTML, CSS, JavaScript, and Audio synthesis engine).
*   `src-tauri/`: Rust backend (Window configurations and native file export integrations).

## Development Prerequisites

Ensure you have installed:
*   [Node.js](https://nodejs.org/) (version 16+ recommended)
*   [Rust & Cargo](https://www.rust-lang.org/)

## Getting Started

1.  Install JavaScript dependencies:
    ```bash
    npm install
    ```
2.  Run the application in development mode:
    ```bash
    npm run tauri dev
    ```

## Build Native App Bundle

To compile the production release optimized app:

```bash
npm run tauri build
```
