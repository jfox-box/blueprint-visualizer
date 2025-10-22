// Popup script to control Blueprint component highlighting

function createToggleHandler(toggleElement, storageKey, action, tab) {
  return async () => {
    const enabled = toggleElement.checked;
    chrome.storage.sync.set({ [storageKey]: enabled });
    try {
      await chrome.tabs.sendMessage(tab.id, { action, enabled });
    } catch (error) {
      console.error(`Error ${action}:`, error);
    }
  };
}

document.addEventListener('DOMContentLoaded', async () => {
    const extensionToggle = document.getElementById('toggleExtension');
    const blueprintBorderToggle = document.getElementById('toggleBlueprintBorder');
    const blueprintHighlightToggle = document.getElementById('toggleBlueprintHighlight');
    const nonBlueprintBorderToggle = document.getElementById('toggleNonBlueprintBorder');
    const nonBlueprintHighlightToggle = document.getElementById('toggleNonBlueprintHighlight');
    const blueprintColorPicker = document.getElementById('blueprintColor');
    const nonBlueprintColorPicker = document.getElementById('nonBlueprintColor');
    const resetColorsLink = document.getElementById('resetColors');
    const blueprintCountElement = document.getElementById('blueprintCount');
    const nonBlueprintCountElement = document.getElementById('nonBlueprintCount');
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Load saved state with proper defaults
    chrome.storage.sync.get(STORAGE_KEYS, (result) => {
      // Check if this is first load
      const isFirstLoad = Object.values(result).some(value => value === undefined);
      
      if (isFirstLoad) {
        // Save defaults to storage
        chrome.storage.sync.set(DEFAULTS);
        console.log('First load detected, initializing popup with defaults');
      }
      
      // Use saved values or defaults
      extensionToggle.checked = result.extensionEnabled ?? DEFAULTS.extensionEnabled;
      blueprintBorderToggle.checked = result.blueprintBorderEnabled ?? DEFAULTS.blueprintBorderEnabled;
      blueprintHighlightToggle.checked = result.blueprintHighlightEnabled ?? DEFAULTS.blueprintHighlightEnabled;
      nonBlueprintBorderToggle.checked = result.nonBlueprintBorderEnabled ?? DEFAULTS.nonBlueprintBorderEnabled;
      nonBlueprintHighlightToggle.checked = result.nonBlueprintHighlightEnabled ?? DEFAULTS.nonBlueprintHighlightEnabled;
      blueprintColorPicker.value = result.blueprintColor ?? DEFAULTS.blueprintColor;
      nonBlueprintColorPicker.value = result.nonBlueprintColor ?? DEFAULTS.nonBlueprintColor;
      
      // Set initial opacity based on extension state
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.style.opacity = extensionToggle.checked ? '1' : '0.6';
      }
    });

    // Handle extension toggle
    extensionToggle.addEventListener('change', async () => {
      const enabled = extensionToggle.checked;
      chrome.storage.sync.set({ extensionEnabled: enabled });
      
      // Update content area opacity
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.style.opacity = enabled ? '1' : '0.6';
      }
      
      try {
        await chrome.tabs.sendMessage(tab.id, { action: ACTIONS.TOGGLE_EXTENSION, enabled });
      } catch (error) {
        console.error('Error toggling extension:', error);
      }
    });

    // Handle color picker changes
    blueprintColorPicker.addEventListener('change', async () => {
      const color = blueprintColorPicker.value;
      chrome.storage.sync.set({ blueprintColor: color });
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: ACTIONS.UPDATE_COLORS,
          blueprintColor: color
        });
      } catch (error) {
        console.error('Error updating Blueprint color:', error);
      }
    });

    nonBlueprintColorPicker.addEventListener('change', async () => {
      const color = nonBlueprintColorPicker.value;
      chrome.storage.sync.set({ nonBlueprintColor: color });
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: ACTIONS.UPDATE_COLORS,
          nonBlueprintColor: color
        });
      } catch (error) {
        console.error('Error updating non-Blueprint color:', error);
      }
    });

    // Handle reset link
    resetColorsLink.addEventListener('click', async () => {
      // Reset to defaults
      blueprintColorPicker.value = DEFAULTS.blueprintColor;
      nonBlueprintColorPicker.value = DEFAULTS.nonBlueprintColor;

      // Save to storage
      chrome.storage.sync.set({
        blueprintColor: DEFAULTS.blueprintColor,
        nonBlueprintColor: DEFAULTS.nonBlueprintColor
      });

      // Update colors in content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: ACTIONS.UPDATE_COLORS,
          blueprintColor: DEFAULTS.blueprintColor,
          nonBlueprintColor: DEFAULTS.nonBlueprintColor
        });
      } catch (error) {
        console.error('Error resetting colors:', error);
      }
    });
    
    async function getCounts(retries = 3) {
      try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_COUNTS });
          if (response && response.blueprintCount !== undefined && response.nonBlueprintCount !== undefined) {
          blueprintCountElement.innerHTML = `Found <span class="count">${response.blueprintCount}</span> Blueprint component${response.blueprintCount !== 1 ? 's' : ''}`;
          nonBlueprintCountElement.innerHTML = `Found <span class="count">${response.nonBlueprintCount}</span> non-Blueprint element${response.nonBlueprintCount !== 1 ? 's' : ''}`;
          return;
          }
      } catch (error) {
      if (i === retries - 1) {
      console.error('Error communicating with content script:', error);
      blueprintCountElement.textContent = 'Please refresh the page to use this extension';
      nonBlueprintCountElement.textContent = '';
      return;
      }
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
      blueprintCountElement.textContent = 'Unable to scan page - try refreshing';
      nonBlueprintCountElement.textContent = '';
    }
    
    // Add toggle event handlers
    blueprintBorderToggle.addEventListener('change', createToggleHandler(blueprintBorderToggle, 'blueprintBorderEnabled', ACTIONS.TOGGLE_BLUEPRINT_BORDER, tab));
    blueprintHighlightToggle.addEventListener('change', createToggleHandler(blueprintHighlightToggle, 'blueprintHighlightEnabled', ACTIONS.TOGGLE_BLUEPRINT_HIGHLIGHT, tab));
    nonBlueprintBorderToggle.addEventListener('change', createToggleHandler(nonBlueprintBorderToggle, 'nonBlueprintBorderEnabled', ACTIONS.TOGGLE_NON_BLUEPRINT_BORDER, tab));
    nonBlueprintHighlightToggle.addEventListener('change', createToggleHandler(nonBlueprintHighlightToggle, 'nonBlueprintHighlightEnabled', ACTIONS.TOGGLE_NON_BLUEPRINT_HIGHLIGHT, tab));
    
    // Try to get counts after a short delay to ensure content script is ready
    setTimeout(() => {
      getCounts();
    }, 100);
  });
  