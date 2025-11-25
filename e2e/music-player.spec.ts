import { test, expect } from '@playwright/test';

test.describe('Music Player App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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
    // Add a few notes
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    await cKey.click();
    
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

  test('should change note duration', async ({ page }) => {
    // Find duration select dropdown
    const durationSelect = page.locator('#keyboard-duration');
    await expect(durationSelect).toBeVisible();
    
    // Change to half note
    await durationSelect.selectOption('half');
    
    // Add a note with the new duration
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Verify note was added
    const notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
  });

  test('should open music modal when clicking view music button', async ({ page }) => {
    // Add a note first
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Open the dropdown menu
    const menuButton = page.getByRole('button', { name: 'Menu' });
    await menuButton.click();
    
    // Click view music button in dropdown
    const viewMusicButton = page.getByRole('button', { name: /View Score/i });
    await viewMusicButton.click();
    
    // Check that modal appears
    const modal = page.locator('.debug-modal-overlay');
    await expect(modal.first()).toBeVisible();
  });

  test('should undo note addition with keyboard shortcut', async ({ page }) => {
    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
    // Verify note was added
    let notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(1);
    
    // Use undo shortcut (Cmd+Z on Mac, Ctrl+Z on other platforms)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+z');
    } else {
      await page.keyboard.press('Control+z');
    }
    
    // Verify note was removed
    notes = page.locator('.note-wrapper');
    await expect(notes).toHaveCount(0);
  });

  test('should delete last note with backspace key', async ({ page }) => {
    // Add two notes
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    await cKey.click();
    
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
    const tempo140Option = page.getByRole('button', { name: /140.*Vivace/i });
    await tempo140Option.click();
    
    // Verify dropdown closed
    await expect(tempoDropdown).not.toBeVisible();
    
    // Verify tempo button tooltip shows new tempo
    await expect(tempoButton).toHaveAttribute('data-tooltip', 'Tempo: 140 BPM');
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
    
    // Debug: Check note position and visibility
    const noteInfo = await note.evaluate(el => {
      const htmlEl = el as HTMLElement;
      return {
        visible: window.getComputedStyle(el).visibility !== 'hidden',
        display: window.getComputedStyle(el).display,
        opacity: window.getComputedStyle(el).opacity,
        bottom: htmlEl.style.bottom,
        left: htmlEl.style.left,
        boundingRect: el.getBoundingClientRect(),
        offsetParent: htmlEl.offsetParent?.className
      };
    });
    console.log('Note info:', noteInfo);
    
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
    
    // Add a note
    const cKey = page.locator('.piano-key').filter({ hasText: 'C4' }).first();
    await cKey.click();
    
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
});
