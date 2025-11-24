# Music Player

A web-based music player application built with React, TypeScript, and Vite that allows users to create, edit, and play musical scores.

## Features

- Interactive piano keyboard for note input
- Musical staff notation display
- Playback controls with tempo adjustment
- Note editing and deletion
- Undo/Redo functionality
- Save and load songs
- Time signature support
- Keyboard shortcuts

## Development

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Testing

### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### E2E Tests (Playwright)

```bash
# Run all e2e tests (headless)
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run playwright:report
```

For more details on e2e testing, see [e2e/README.md](./e2e/README.md)

### AI-Powered Testing with Playwright MCP

This project includes Playwright MCP (Model Context Protocol) integration, enabling AI assistants to interact with your browser for testing and automation.

See [PLAYWRIGHT_MCP.md](./PLAYWRIGHT_MCP.md) for setup and usage instructions.

## Code Quality

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors
npm run lint:fix
```

## Keyboard Shortcuts

- `Space` - Play/Pause playback
- `Backspace/Delete` - Remove last note
- `Cmd/Ctrl + Z` - Undo
- `Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y` - Redo

## Project Structure

```
src/
├── components/       # React components
│   ├── Keyboard.tsx
│   ├── MusicalStaff.tsx
│   ├── MenuBar.tsx
│   └── ...
├── types/           # TypeScript type definitions
│   └── music.ts
├── utils/           # Utility functions
│   ├── musicUtilities.ts
│   ├── playbackUtilities.ts
│   └── ...
└── App.tsx          # Main application component
```

## License

[Your License Here]
