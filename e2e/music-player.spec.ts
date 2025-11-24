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
    
    // Check for tempo control (it's a select dropdown, not input[type="number"])
    const tempoSelect = page.locator('#tempo');
    await expect(tempoSelect).toBeVisible();
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
    
    // Click view music button
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
    // Find tempo select dropdown
    const tempoSelect = page.locator('#tempo');
    await expect(tempoSelect).toBeVisible();
    
    // Get initial value
    const initialValue = await tempoSelect.inputValue();
    
    // Change tempo to 140
    await tempoSelect.selectOption('140');
    
    // Verify value changed
    const newValue = await tempoSelect.inputValue();
    expect(newValue).toBe('140');
    expect(newValue).not.toBe(initialValue);
  });
});
