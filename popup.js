// Popup script to control Blueprint component highlighting

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
    chrome.storage.sync.get([
      'extensionEnabled',
      'blueprintBorderEnabled',
      'blueprintHighlightEnabled',
      'nonBlueprintBorderEnabled',
      'nonBlueprintHighlightEnabled',
      'blueprintColor',
      'nonBlueprintColor'
    ], (result) => {
      // Default values for first load
      const defaults = {
        extensionEnabled: true,
        blueprintBorderEnabled: false,
        blueprintHighlightEnabled: false,
        nonBlueprintBorderEnabled: false,
        nonBlueprintHighlightEnabled: false,
        blueprintColor: '#00ff00',
        nonBlueprintColor: '#ff0000'
      };
      
      // Check if this is first load
      const isFirstLoad = Object.values(result).every(value => value === undefined);
      
      if (isFirstLoad) {
        // Save defaults to storage
        chrome.storage.sync.set(defaults);
        console.log('First load detected, initializing popup with defaults');
      }
      
      // Use saved values or defaults
      extensionToggle.checked = result.extensionEnabled ?? defaults.extensionEnabled;
      blueprintBorderToggle.checked = result.blueprintBorderEnabled ?? defaults.blueprintBorderEnabled;
      blueprintHighlightToggle.checked = result.blueprintHighlightEnabled ?? defaults.blueprintHighlightEnabled;
      nonBlueprintBorderToggle.checked = result.nonBlueprintBorderEnabled ?? defaults.nonBlueprintBorderEnabled;
      nonBlueprintHighlightToggle.checked = result.nonBlueprintHighlightEnabled ?? defaults.nonBlueprintHighlightEnabled;
      blueprintColorPicker.value = result.blueprintColor ?? defaults.blueprintColor;
      nonBlueprintColorPicker.value = result.nonBlueprintColor ?? defaults.nonBlueprintColor;
    });
    extensionToggle.addEventListener('change', async () => {
      const enabled = extensionToggle.checked;
      chrome.storage.sync.set({ extensionEnabled: enabled });
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleExtension',
          enabled: enabled
        });
      } catch (error) {
        handleExtensionError(error, 'toggling extension');
        extensionToggle.checked = !enabled;
        chrome.storage.sync.set({ extensionEnabled: !enabled });
      }
    });

    // Handle color picker changes
    blueprintColorPicker.addEventListener('change', async () => {
      const color = blueprintColorPicker.value;
      chrome.storage.sync.set({ blueprintColor: color });
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateColors',
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
          action: 'updateColors',
          nonBlueprintColor: color
        });
      } catch (error) {
        handleExtensionError(error, 'updating non-Blueprint color');
      }
    });

    // Handle reset link
    resetColorsLink.addEventListener('click', async () => {
      // Reset to defaults
      blueprintColorPicker.value = '#00ff00';
      nonBlueprintColorPicker.value = '#ff0000';

      // Save to storage
      chrome.storage.sync.set({
        blueprintColor: '#00ff00',
        nonBlueprintColor: '#ff0000'
      });

      // Update colors in content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateColors',
          blueprintColor: '#00ff00',
          nonBlueprintColor: '#ff0000'
        });
      } catch (error) {
        handleExtensionError(error, 'resetting colors');
      }
    });

    
    // Get component counts with retry logic for first load
    async function getCountsWithRetry(retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCounts' });
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
    
    // Try to get counts after a short delay to ensure content script is ready
    setTimeout(() => {
      getCountsWithRetry();
    }, 100);
    
    // Handle Blueprint border toggle change
    blueprintBorderToggle.addEventListener('change', async () => {
      const enabled = blueprintBorderToggle.checked;
      
      // Save state
      chrome.storage.sync.set({ blueprintBorderEnabled: enabled });
      
      // Send message to content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleBlueprintBorder',
          enabled: enabled
        });
      } catch (error) {
        handleExtensionError(error, 'toggling Blueprint border');
        // Revert toggle state if message failed
        blueprintBorderToggle.checked = !enabled;
        chrome.storage.sync.set({ blueprintBorderEnabled: !enabled });
      }
    });
    
    // Handle Blueprint highlight toggle change
    blueprintHighlightToggle.addEventListener('change', async () => {
      const enabled = blueprintHighlightToggle.checked;
      
      // Save state
      chrome.storage.sync.set({ blueprintHighlightEnabled: enabled });
      
      // Send message to content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleBlueprintHighlight',
          enabled: enabled
        });
      } catch (error) {
        handleExtensionError(error, 'toggling Blueprint highlight');
        // Revert toggle state if message failed
        blueprintHighlightToggle.checked = !enabled;
        chrome.storage.sync.set({ blueprintHighlightEnabled: !enabled });
      }
    });
    
    // Handle non-Blueprint border toggle change
    nonBlueprintBorderToggle.addEventListener('change', async () => {
      const enabled = nonBlueprintBorderToggle.checked;
      
      // Save state
      chrome.storage.sync.set({ nonBlueprintBorderEnabled: enabled });
      
      // Send message to content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleNonBlueprintBorder',
          enabled: enabled
        });
      } catch (error) {
        handleExtensionError(error, 'toggling non-Blueprint border');
        // Revert toggle state if message failed
        nonBlueprintBorderToggle.checked = !enabled;
        chrome.storage.sync.set({ nonBlueprintBorderEnabled: !enabled });
      }
    });
    
    // Handle non-Blueprint highlight toggle change
    nonBlueprintHighlightToggle.addEventListener('change', async () => {
      const enabled = nonBlueprintHighlightToggle.checked;
      
      // Save state
      chrome.storage.sync.set({ nonBlueprintHighlightEnabled: enabled });
      
      // Send message to content script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'toggleNonBlueprintHighlight',
          enabled: enabled
        });
      } catch (error) {
        handleExtensionError(error, 'toggling non-Blueprint highlight');
        // Revert toggle state if message failed
        nonBlueprintHighlightToggle.checked = !enabled;
        chrome.storage.sync.set({ nonBlueprintHighlightEnabled: !enabled });
      }
    });
  });
  