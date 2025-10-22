// Popup script to control Blueprint component highlighting

// Constants
const CLASSES = {
  BLUEPRINT_HIGHLIGHT: 'bp-extension-blueprint-highlight',
  NON_BLUEPRINT_HIGHLIGHT: 'bp-extension-non-blueprint-highlight',
  BLUEPRINT_BORDER: 'bp-extension-blueprint-border',
  NON_BLUEPRINT_BORDER: 'bp-extension-non-blueprint-border'
};

const STORAGE_KEYS = [
  'extensionEnabled',
  'blueprintBorderEnabled',
  'blueprintHighlightEnabled',
  'nonBlueprintBorderEnabled',
  'nonBlueprintHighlightEnabled',
  'blueprintColor',
  'nonBlueprintColor'
];

const DEFAULTS = {
  extensionEnabled: true,
  blueprintBorderEnabled: false,
  blueprintHighlightEnabled: false,
  nonBlueprintBorderEnabled: false,
  nonBlueprintHighlightEnabled: false,
  blueprintColor: '#00ff00',
  nonBlueprintColor: '#ff0000'
};

const ACTIONS = {
  TOGGLE_EXTENSION: 'toggleExtension',
  TOGGLE_BLUEPRINT_BORDER: 'toggleBlueprintBorder',
  TOGGLE_BLUEPRINT_HIGHLIGHT: 'toggleBlueprintHighlight',
  TOGGLE_NON_BLUEPRINT_BORDER: 'toggleNonBlueprintBorder',
  TOGGLE_NON_BLUEPRINT_HIGHLIGHT: 'toggleNonBlueprintHighlight',
  UPDATE_COLORS: 'updateColors',
  GET_COUNTS: 'getCounts'
};

const OPACITY = {
  BLUEPRINT: 0.1,
  NON_BLUEPRINT: 0.01
};

// Helper function to handle extension context errors
function handleExtensionError(error, action) {
  if (error.message && error.message.includes('Extension context invalidated')) {
    console.log('Extension context invalidated, please reload the page');
    return true;
  } else {
    console.error(`Error ${action}:`, error);
    return false;
  }
}


function createToggleHandler(toggleElement, storageKey, action, tab, revertOnError = false) {
  return async () => {
    const enabled = toggleElement.checked;
    chrome.storage.sync.set({ [storageKey]: enabled });
    try {
      await chrome.tabs.sendMessage(tab.id, { action, enabled });
    } catch (error) {
      handleExtensionError(error, action);
      if (revertOnError) {
        toggleElement.checked = !enabled;
        chrome.storage.sync.set({ [storageKey]: !enabled });
      }
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
      const isFirstLoad = Object.values(result).every(value => value === undefined);
      
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
    });
    extensionToggle.addEventListener('change', createToggleHandler(extensionToggle, 'extensionEnabled', ACTIONS.TOGGLE_EXTENSION, tab, true));

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
        handleExtensionError(error, 'updating Blueprint color');
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
        handleExtensionError(error, 'updating non-Blueprint color');
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
        handleExtensionError(error, 'resetting colors');
      }
    });

    
    // Get component counts with retry logic for first load
    async function getCountsWithRetry(retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_COUNTS });
          if (response && response.blueprintCount !== undefined && response.nonBlueprintCount !== undefined) {
            blueprintCountElement.innerHTML = `Found <span class="count">${response.blueprintCount}</span> Blueprint component${response.blueprintCount !== 1 ? 's' : ''}`;
            nonBlueprintCountElement.innerHTML = `Found <span class="count">${response.nonBlueprintCount}</span> non-Blueprint element${response.nonBlueprintCount !== 1 ? 's' : ''}`;
            return;
          }
        } catch (error) {
          if (i === retries - 1) {
            handleExtensionError(error, 'communicating with content script');
            blueprintCountElement.textContent = 'Please refresh the page to use this extension';
            nonBlueprintCountElement.textContent = '';
            return;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      blueprintCountElement.textContent = 'Unable to scan page - try refreshing';
      nonBlueprintCountElement.textContent = '';
    }
    
    // Add toggle event handlers
    blueprintBorderToggle.addEventListener('change', createToggleHandler(blueprintBorderToggle, 'blueprintBorderEnabled', ACTIONS.TOGGLE_BLUEPRINT_BORDER, tab, true));
    blueprintHighlightToggle.addEventListener('change', createToggleHandler(blueprintHighlightToggle, 'blueprintHighlightEnabled', ACTIONS.TOGGLE_BLUEPRINT_HIGHLIGHT, tab, true));
    nonBlueprintBorderToggle.addEventListener('change', createToggleHandler(nonBlueprintBorderToggle, 'nonBlueprintBorderEnabled', ACTIONS.TOGGLE_NON_BLUEPRINT_BORDER, tab, true));
    nonBlueprintHighlightToggle.addEventListener('change', createToggleHandler(nonBlueprintHighlightToggle, 'nonBlueprintHighlightEnabled', ACTIONS.TOGGLE_NON_BLUEPRINT_HIGHLIGHT, tab, true));
    
    // Try to get counts after a short delay to ensure content script is ready
    setTimeout(() => {
      getCountsWithRetry();
    }, 100);
  });
  