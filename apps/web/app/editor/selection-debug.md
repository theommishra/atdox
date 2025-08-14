# Selection Debugging Guide

## Issue Description
"Selection is not working it applying effects on un selected text too"

## What This Means
When you try to apply formatting effects (bold, italic, color, etc.), they're being applied to text that isn't currently selected.

## Debugging Steps

### 1. Open Browser Console
- Open the editor page
- Press F12 to open Developer Tools
- Go to Console tab

### 2. Test Basic Selection
1. Type some text in the editor (e.g., "This is a test document")
2. Select a word (e.g., "test")
3. Check console for selection logs:
   - Look for "🎯 Selection change detected" messages
   - Verify the `from` and `to` values are correct
   - Check if `hasSelection` is `true`

### 3. Test Formatting Commands
1. With text selected, click a formatting button (e.g., Bold)
2. Check console for:
   - "🎯 Bold button clicked - Current selection" message
   - Verify selection values before command execution
   - Check if "No text selected" warning appears

### 4. Check for Selection Loss
Look for these warning messages:
- "🎯 No text selected for [format] formatting"
- "🎯 Cannot apply [format] formatting - editor not focused"
- "🎯 Cannot apply [format] formatting - invalid selection"

### 5. Monitor Selection State
Watch for these console messages:
- Selection validation logs
- Editor focus status
- Selection coordinate calculations

## Expected Behavior
- Selection should be maintained when clicking toolbar buttons
- Only selected text should be formatted
- Console should show valid selection coordinates
- No "No text selected" warnings should appear

## Common Issues to Look For
1. **Selection lost before command execution**
2. **Invalid selection coordinates**
3. **Editor losing focus**
4. **Selection out of document bounds**

## Test Cases
1. **Single word selection**: Select one word, apply bold
2. **Multiple word selection**: Select multiple words, apply italic
3. **Partial word selection**: Select part of a word, apply color
4. **Line selection**: Select entire line, apply highlight
5. **No selection**: Click formatting button without selecting text

## Console Logs to Monitor
- `🎯 Selection change detected`
- `🎯 Selection coordinates`
- `🎯 [Format] button clicked - Current selection`
- `🎯 [Format] command executed - New selection`
- `🎯 Editor focus check`
- `🎯 Validating selection`

## If Issues Persist
1. Check if selection is lost immediately after clicking button
2. Verify editor maintains focus
3. Check if selection coordinates are valid
4. Look for any error messages in console

## Next Steps
After testing, report:
1. Which formatting commands fail
2. What console messages appear
3. Whether selection is maintained
4. Any error messages or warnings
