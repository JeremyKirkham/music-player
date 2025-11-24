# E2E Tests with Playwright

This directory contains end-to-end integration tests for the Music Player application using Playwright.

## Running Tests

### Run all tests (headless mode)
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run playwright:report
```

## Test Structure

Tests are organized in spec files (`.spec.ts`) that test specific features or user flows:

- `music-player.spec.ts` - Main integration tests covering core functionality:
  - UI elements visibility
  - Note addition via keyboard
  - Playback controls
  - Note editing and deletion
  - Keyboard shortcuts
  - Tempo changes

## Writing New Tests

To add new tests, create a new `.spec.ts` file in the `e2e` directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project. Key settings:

- **Browsers**: Tests run on Chromium, Firefox, and WebKit
- **Base URL**: http://localhost:5173 (Vite dev server)
- **Auto-start**: Dev server starts automatically before tests
- **Retries**: Enabled on CI (2 retries)
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

## CI/CD Integration

The tests are configured to work in CI environments:
- Parallel execution is disabled on CI for stability
- Failed tests automatically retry twice
- Test reports are generated in HTML format

## Useful Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
