# Blueprint Visualizer Chrome Extension

A Chrome extension that helps developers visualize Blueprint components and non-Blueprint elements on web pages with customizable highlighting options.

## Features

- 🔍 **Smart Detection**: Automatically finds Blueprint components (elements with `bp_` classes) and non-Blueprint elements
- 🎨 **Dual Highlighting**: Separate highlighting for Blueprint (green) and non-Blueprint (red) elements
- 🎛️ **Granular Controls**: Independent toggles for borders and highlights on both element types
- 💾 **Persistent Settings**: Remembers all preferences across browser sessions

## Installation

### From Source (Developer Mode)

1. **Download or clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the `bp-visualizer` folder
5. **Pin the extension** to your toolbar for easy access

## Usage

1. **Navigate** to any webpage that uses Blueprint components
2. **Click the extension icon** in your Chrome toolbar
3. **Configure highlighting** with the four individual toggles:
   - **Blueprint Elements**: Border and Highlight toggles (green)
   - **Non-Blueprint Elements**: Border and Highlight toggles (red)
4. **View live counts** of elements found on the current page

## Technical Details

### File Structure

```
bp-visualizer/
├── manifest.json          # Extension configuration
├── main.html              # Popup interface
├── popup.css              # Popup styles
├── popup.js               # Popup logic and communication
├── content.js             # Content script for page interaction
├── styles.css             # Highlighting styles
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

### Permissions

- `activeTab`: Access to the current tab for element detection
- `storage`: Save user preferences across sessions
- `<all_urls>`: Work on any website

### Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Development

### Testing

1. Load the extension in developer mode
2. Visit a page with Blueprint components (i.e. Box.com)
3. Test all four toggle combinations
4. Verify element counting works correctly
5. Test with dynamically loaded content
6. Test with pages containing iframes

### Customization

You can modify the highlighting colors by editing `styles.css`:

```css
/* Blueprint highlight (green) */
.bp-extension-blueprint-highlight::after {
  background-color: rgba(0, 255, 0, 0.1) !important;
}

/* Non-Blueprint highlight (red) */
.bp-extension-non-blueprint-highlight::after {
  background-color: rgba(255, 0, 0, 0.01) !important;
}
```

## Troubleshooting

### Extension Not Working

1. **Refresh the page** after installing the extension
2. **Check the console** for any error messages
3. **Ensure the master toggle is enabled** (top-right switch)
4. **Try disabling and re-enabling** the extension

### No Elements Found

- Verify the page actually uses Blueprint CSS classes (`bp_` prefixed)
- Check that elements have classes starting with `bp_`
- Some elements might be loaded dynamically - try scrolling or interacting with the page
- Ensure you're on the main frame (not inside an iframe)

### Performance Issues

- The extension uses efficient single-pass scanning
- If experiencing slowdowns, try disabling some toggles
- Large pages with many elements may take a moment to scan

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.
