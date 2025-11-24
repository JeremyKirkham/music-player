# Quick Start: Playwright MCP for Music Player

## What You Can Do

With Playwright MCP installed, you can now use AI chat to:

✅ **Automate browser interactions**
- "Open localhost:5173 and click on middle C"
- "Fill in the tempo field with 140 and press enter"

✅ **Generate tests from natural language**
- "Create a test that adds 5 notes and verifies they appear on the staff"
- "Write a test for the undo functionality"

✅ **Debug and inspect**
- "Take a screenshot of the current page"
- "Show me the console errors"
- "List all buttons on the page"

✅ **Visual testing**
- "Capture the musical staff and keyboard"
- "Record a video of playing a song"

## Setup (Choose One)

### Option 1: VS Code Click Install
[Click here to install in VS Code](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540playwright%252Fmcp%2540latest%2522%255D%257D)

### Option 2: Manual MCP Configuration
Add to your MCP settings:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Example AI Chat Commands

Once configured, try these commands in your AI chat:

```
"Start the dev server and open the music player in Chrome"

"Click on the C4 key, then D4, then E4"

"Take a screenshot and save it as 'music-player-demo.png'"

"Generate a Playwright test that:
1. Opens the app
2. Adds 5 different notes
3. Clicks play
4. Waits for playback to finish
5. Takes a screenshot"

"Debug: Why isn't the play button working?"

"Show me all console errors on the page"
```

## Output Location

All screenshots, traces, and videos are saved to:
```
./playwright-output/
```

## Verify Installation

Run this to verify the MCP server is working:
```bash
npx @playwright/mcp --help
```

## Need Help?

See [PLAYWRIGHT_MCP.md](./PLAYWRIGHT_MCP.md) for complete documentation.

## Integration with E2E Tests

Your existing e2e tests in `e2e/` and the MCP server use the same Playwright installation, so you can:

1. Use AI chat to explore features → Generate test ideas
2. Convert MCP interactions → Formal test files  
3. Debug failing tests → Interactive browser control
4. Generate locators → Copy to test code

Happy automating! 🎭
