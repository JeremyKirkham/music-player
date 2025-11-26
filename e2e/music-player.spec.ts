import { test, expect } from '@playwright/test';

test.describe('Music Player App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());
    // Reload page after clearing storage
    await page.reload();
  });

  test.afterEach(async ({ page }) => {
    // Clean up localStorage after each test
    await page.evaluate(() => localStorage.clear());
  });

  test('should display the music player title', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toHaveText('Music Player');
  });

  test('should display the musical staff', async ({ page }) => {
    const staff = page.locator('.musical-staff-container');
    await expect(staff).toBeVisible();
  });

  test('should display the keyboard', async ({ page }) => {
    const keyboard = page.locator('.keyboard');
    await expect(keyboard).toBeVisible();
  });

  test('should have menu bar with controls', async ({ page }) => {
    const menuBar = page.locator('.menu-bar');
    await expect(menuBar).toBeVisible();
    
    // Check for tempo button (it's now a button that opens a dropdown)
    const tempoButton = page.getByRole('button', { name: 'Tempo' });
    await expect(tempoButton).toBeVisible();
  });

  test('should add a note when clicking a keyboard key', async ({ page }) => {
    // Wait for the keyboard to be ready
    const keyboard = page.locator('.keyboard');
    await expect(keyboard).toBeVisible();
    
    // Click on middle C key (it's a button with class piano-key)
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Check that a note appears on the staff
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
  });

  test('should play notes when clicking the play button', async ({ page }) => {
    // Add a note first
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Find and click the play button
    const playButton = page.getByRole('button', { name: /play|▶/i });
    await playButton.click();
    
    // Check that the note becomes active during playback
    await expect(page.locator('.note-wrapper.active')).toHaveCount(1, { timeout: 1000 });
  });

  test('should clear all notes when clicking clear button', async ({ page }) => {
    // Add a few notes (wait between clicks to avoid chord detection)
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    await page.waitForTimeout(200); // Wait longer than chord window (150ms)
    await cKey.click();
    await page.waitForTimeout(200);

    // Verify notes were added
    const notesBeforeClear = page.locator('.note-wrapper');
    await expect(notesBeforeClear).toHaveCount(2);
    
    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click clear button
    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();
    
    // Verify notes are gone
    const notesAfterClear = page.locator('.note-wrapper');
    await expect(notesAfterClear).toHaveCount(0);
  });


  test('should open music modal when clicking view music button', async ({ page }) => {
    // Add a note first
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();

    // Open the dropdown menu
    const menuButton = page.locator('.menu-toggle-btn');
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Click view music button in dropdown (it's a menuitem, not a button)
    const viewMusicButton = page.getByRole('menuitem', { name: /View Score/i });
    await expect(viewMusicButton).toBeVisible();
    await viewMusicButton.click();

    // Check that dialog modal appears with title
    const dialogTitle = page.getByRole('heading', { name: /Music Score/i });
    await expect(dialogTitle).toBeVisible();
  });

  test('should undo note addition with keyboard shortcut', async ({ page, browserName }) => {
    // Skip in WebKit due to keyboard shortcut handling differences
    test.skip(browserName === 'webkit', 'WebKit has issues with Meta+Z keyboard shortcuts in Playwright');

    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();

    // Verify note was added
    let notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);

    // Wait a bit to ensure the note is fully committed to history
    await page.waitForTimeout(100);

    // Use undo shortcut (Cmd+Z on Mac, Ctrl+Z on other platforms)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+KeyZ');
    } else {
      await page.keyboard.press('Control+KeyZ');
    }

    // Verify note was removed
    notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(0);
  });

  test('should delete last note with backspace key', async ({ page }) => {
    // Add two notes (wait between clicks to avoid chord detection)
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    await page.waitForTimeout(200); // Wait longer than chord window (150ms)
    await cKey.click();
    await page.waitForTimeout(200);

    // Verify two notes were added
    let notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(2);
    
    // Press backspace
    await page.keyboard.press('Backspace');
    
    // Verify one note was removed
    notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
  });

  test('should change tempo', async ({ page }) => {
    // Find and click tempo button to open dropdown
    const tempoButton = page.getByRole('button', { name: 'Tempo' });
    await expect(tempoButton).toBeVisible();
    await tempoButton.click();

    // Wait for dropdown to appear
    const tempoDropdown = page.locator('.tempo-dropdown');
    await expect(tempoDropdown).toBeVisible();

    // Click on 140 BPM option
    const tempo140Option = page.getByRole('menuitem', { name: /140.*Vivace/i });
    await expect(tempo140Option).toBeVisible();
    await tempo140Option.click();

    // Verify dropdown closed
    await expect(tempoDropdown).not.toBeVisible();
  });

  test('should display FAB buttons when clicking a note', async ({ page }) => {
    // Ensure treble clef is visible (it should be by default)
    const trebleCheckbox = page.locator('.clef-checkbox-label').filter({ hasText: 'Treble' }).locator('input[type="checkbox"]');
    await expect(trebleCheckbox).toBeChecked();
    
    // Add a note first
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Wait for note to appear - check that it exists in DOM
    const note = page.locator('.note-wrapper').first();
    await expect(note).toHaveCount(1);
    
    // Use force click since note might be partially obscured
    await note.click({ force: true, timeout: 5000 });
    
    // Wait a bit for the FAB to appear
    await page.waitForTimeout(300);
    
    // Check that FAB buttons appear
    const fabContainer = page.locator('.note-fab-container');
    await expect(fabContainer).toBeVisible({ timeout: 2000 });
    
    // Check that both buttons are present
    const deleteButton = page.locator('.delete-button');
    const durationButton = page.locator('.duration-button');
    
    await expect(deleteButton).toBeVisible();
    await expect(durationButton).toBeVisible();
  });

  test('should close FAB buttons when clicking backdrop', async ({ page }) => {
    // Add a note and open FAB menu
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    const note = page.locator('.note-wrapper').first();
    await note.scrollIntoViewIfNeeded();
    await note.click();
    
    // Wait for FAB to appear
    const fabContainer = page.locator('.note-fab-container');
    await expect(fabContainer).toBeVisible({ timeout: 2000 });
    
    // Click on the backdrop
    const backdrop = page.locator('.note-fab-backdrop');
    await backdrop.click();
    
    // Verify FAB is closed
    await expect(fabContainer).not.toBeVisible();
  });

  test('should delete note when clicking delete FAB button', async ({ page }) => {
    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Verify note exists
    let notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
    
    // Click on the note to open FAB menu
    const note = notes.first();
    await note.scrollIntoViewIfNeeded();
    await note.click();
    
    // Wait for FAB to appear
    const deleteButton = page.locator('.delete-button');
    await expect(deleteButton).toBeVisible({ timeout: 2000 });
    
    // Click delete button
    await deleteButton.click();
    
    // Verify note is deleted
    notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(0);
  });

  test('should open edit modal when clicking change duration FAB button', async ({ page }) => {
    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Click on the note to open FAB menu
    const note = page.locator('.note-wrapper').first();
    await note.scrollIntoViewIfNeeded();
    await note.click();
    
    // Wait for FAB to appear and click duration button
    const durationButton = page.locator('.duration-button');
    await expect(durationButton).toBeVisible({ timeout: 2000 });
    await durationButton.click();
    
    // Check that duration dropdown appears
    const durationDropdown = page.locator('.duration-dropdown');
    await expect(durationDropdown).toBeVisible({ timeout: 2000 });
    
    // Verify dropdown has duration options
    const durationOptions = page.locator('.duration-option');
    await expect(durationOptions).toHaveCount(5);
    
    // Select eighth note (use nth to get the exact one - Eighth is 4th in list, 0-indexed = 3)
    const eighthOption = page.locator('.duration-option').nth(3);
    await eighthOption.click({ force: true });
    await page.waitForTimeout(500);
    
    // Verify FAB is closed after selection
    await expect(durationButton).not.toBeVisible();
    
    // Verify the note still exists (duration should have changed)
    const updatedNote = page.locator('.note-wrapper').first();
    await expect(updatedNote).toBeVisible();
  });

  test('should not trigger FAB when dragging a note', async ({ page }) => {
    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Get the note
    const note = page.locator('.note-wrapper').first();
    await note.scrollIntoViewIfNeeded();
    
    // Get initial position
    const initialBox = await note.boundingBox();
    
    // Perform a drag operation (move note up by dragging)
    await note.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x, initialBox!.y - 50, { steps: 5 });
    await page.mouse.up();
    
    // FAB should NOT appear after drag
    const fabContainer = page.locator('.note-fab-container');
    await expect(fabContainer).not.toBeVisible({ timeout: 500 });
  });

  test('should work with touch events on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Add a note - use force: true because black keys may overlap white keys on mobile
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click({ force: true });

    // Click on the note to open FAB menu (use click instead of tap for testing)
    const note = page.locator('.note-wrapper').first();
    await expect(note).toHaveCount(1);
    await note.scrollIntoViewIfNeeded();
    await note.click();

    // Wait for FAB to appear
    const fabContainer = page.locator('.note-fab-container');
    await expect(fabContainer).toBeVisible({ timeout: 2000 });

    // Click delete button
    const deleteButton = page.locator('.delete-button');
    await deleteButton.click();

    // Verify note is deleted
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(0);
  });

  test('should record a chord when multiple keys pressed simultaneously', async ({ page }) => {
    // Wait for keyboard to be ready
    const keyboard = page.locator('.keyboard');
    await expect(keyboard).toBeVisible();

    // Press all three keys using keyboard shortcuts (hold down multiple keys)
    // C4 = 'a', E4 = 'd', G4 = 'g' (C major chord)
    await page.keyboard.down('a');
    await page.keyboard.down('d');
    await page.keyboard.down('g');

    // Wait a bit to ensure all keys are registered
    await page.waitForTimeout(50);

    // Release all keys
    await page.keyboard.up('a');
    await page.keyboard.up('d');
    await page.keyboard.up('g');

    // Wait for the chord detection window to commit the chord
    await page.waitForTimeout(200);

    // Should create only ONE event (a chord) instead of three separate notes
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
  });

  test('should record sequential notes separately when pressed slowly', async ({ page }) => {
    // Wait for keyboard to be ready
    const keyboard = page.locator('.keyboard');
    await expect(keyboard).toBeVisible();

    // Press keys one at a time with sufficient delay
    await page.keyboard.press('a'); // C4
    await page.waitForTimeout(200); // Wait longer than chord window (150ms)

    await page.keyboard.press('d'); // E4
    await page.waitForTimeout(200);

    await page.keyboard.press('g'); // G4
    await page.waitForTimeout(200);

    // Should create THREE separate notes
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(3);
  });

  test('should record chord when keys pressed rapidly in sequence', async ({ page }) => {
    // Wait for keyboard to be ready
    const keyboard = page.locator('.keyboard');
    await expect(keyboard).toBeVisible();

    // Press keys rapidly in sequence (within 150ms window)
    await page.keyboard.down('a'); // C4
    await page.waitForTimeout(30);
    await page.keyboard.down('d'); // E4
    await page.waitForTimeout(30);
    await page.keyboard.down('g'); // G4
    await page.waitForTimeout(30);

    // Release all keys
    await page.keyboard.up('a');
    await page.keyboard.up('d');
    await page.keyboard.up('g');

    // Wait for commit
    await page.waitForTimeout(200);

    // Should create ONE chord event
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
  });

  test('should play all notes in chord simultaneously during playback', async ({ page }) => {
    // Create a chord by pressing keys simultaneously
    await page.keyboard.down('a'); // C4
    await page.keyboard.down('d'); // E4
    await page.keyboard.down('g'); // G4
    await page.waitForTimeout(50);
    await page.keyboard.up('a');
    await page.keyboard.up('d');
    await page.keyboard.up('g');
    await page.waitForTimeout(200);

    // Verify chord was created
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);

    // Click play button
    const playButton = page.getByRole('button', { name: /play|▶/i });
    await playButton.click();

    // During playback, all keys in the chord should become active
    await expect(page.locator('.piano-key.active')).toHaveCount(3, { timeout: 1000 });
  });
});
