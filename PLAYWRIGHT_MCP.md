# Playwright MCP Integration

This project includes the Playwright MCP (Model Context Protocol) server, which enables AI chat integration with Playwright for browser automation and testing.

## What is Playwright MCP?

Playwright MCP allows AI assistants (like GitHub Copilot, Claude, etc.) to interact with web browsers programmatically. This enables:

- **Interactive browser automation** - Navigate websites, fill forms, click buttons
- **Visual testing** - Take screenshots, capture page snapshots
- **Test generation** - Generate Playwright tests from natural language descriptions
- **Debugging assistance** - Inspect elements, console messages, network requests
- **Cross-browser testing** - Test on Chromium, Firefox, and WebKit

## Installation

The Playwright MCP package is already installed:

```bash
npm install -D @playwright/mcp
```

## Configuration

### For VS Code (GitHub Copilot)

The MCP server can be configured in VS Code. You have two options:

#### Option 1: Quick Install (Recommended)

Click the button to install directly in VS Code:

[Install Playwright MCP in VS Code](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)

#### Option 2: Manual Configuration

Add this configuration to your MCP settings (see [VS Code MCP documentation](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "enabled": true
    }
  }
}
```

### Configuration File

A sample configuration is provided in `mcp-config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser",
        "chromium",
        "--output-dir",
        "./playwright-output"
      ],
      "enabled": true
    }
  }
}
```

### Common Configuration Options

You can customize the MCP server with various command-line arguments:

```bash
--browser <browser>              # Browser to use: chrome, firefox, webkit, msedge
--headless                       # Run in headless mode
--output-dir <path>              # Directory for output files
--save-trace                     # Save Playwright traces
--save-video <size>              # Save video recordings (e.g., "800x600")
--device <device>                # Emulate device (e.g., "iPhone 15")
--timeout-action <ms>            # Action timeout (default: 5000ms)
--user-data-dir <path>           # Persistent browser profile directory
--isolated                       # Use isolated browser context
```

Example with options:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser",
        "chromium",
        "--headless",
        "--save-trace",
        "--output-dir",
        "./playwright-output"
      ]
    }
  }
}
```

## Using Playwright MCP

Once configured, you can interact with your browser through AI chat:

### Example Commands

**Navigate and interact:**
```
"Open http://localhost:5173 and click the Play button"
```

**Take screenshots:**
```
"Take a screenshot of the music player interface"
```

**Generate tests:**
```
"Generate a Playwright test that adds three notes and plays them"
```

**Inspect elements:**
```
"Show me all the buttons on the page"
```

**Debug issues:**
```
"Check the console for any errors"
```

## Available MCP Tools

The Playwright MCP server provides the following capabilities:

### Core Automation
- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_type` - Type text into fields
- `browser_fill_form` - Fill multiple form fields
- `browser_snapshot` - Capture accessibility snapshot
- `browser_take_screenshot` - Take screenshots
- `browser_evaluate` - Run JavaScript on the page
- `browser_wait_for` - Wait for conditions

### Tab Management
- `browser_tabs` - List, create, close, or select tabs

### Debugging
- `browser_console_messages` - Get console output
- `browser_network_requests` - View network activity

### Test Generation
- `browser_generate_locator` - Create test locators
- `browser_verify_element_visible` - Verify elements
- `browser_verify_text_visible` - Verify text content

## Output Files

When using MCP tools, output files (screenshots, traces, videos) are saved to:

```
./playwright-output/
```

Add this to your `.gitignore` if you don't want to commit these files.

## Running as Standalone Server

For advanced use cases, you can run the MCP server as a standalone HTTP server:

```bash
npx @playwright/mcp@latest --port 8931
```

Then configure your MCP client to connect via HTTP:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

## Browser Extension

Playwright MCP also offers a Chrome extension that allows you to connect to existing browser tabs and leverage logged-in sessions. See the [extension documentation](https://github.com/microsoft/playwright/tree/main/packages/mcp/extension) for details.

## Troubleshooting

### Browser Not Found

If you get an error about the browser not being installed, run:

```bash
npx playwright install chromium
```

Or use the `browser_install` MCP tool through AI chat.

### Permission Issues

The MCP server requires permission to interact with web pages. Make sure to grant permissions when prompted by your AI assistant.

### Display Issues on Headless Systems

If running on a system without a display, use the `--headless` flag or run as a standalone server with `--port`.

## Resources

- [Playwright MCP Documentation](https://playwright.dev)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [VS Code MCP Guide](https://code.visualstudio.com/docs/copilot/chat/mcp-servers)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## Integration with E2E Tests

The Playwright MCP server uses the same Playwright installation as your e2e tests. You can:

1. Use MCP to explore your app and generate test ideas
2. Convert MCP interactions into formal e2e tests
3. Debug failing tests by interacting with the browser through AI
4. Generate test locators and assertions

Example workflow:

1. Use AI chat: "Navigate to the music player and add a note"
2. Ask AI: "Generate a Playwright test for what we just did"
3. Save the generated test to `e2e/` directory
4. Run with `npm run test:e2e`
