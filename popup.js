// Popup script to control Blueprint component highlighting

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
    
    // Load saved state
    chrome.storage.sync.get([
      'extensionEnabled',
      'blueprintBorderEnabled',
      'blueprintHighlightEnabled',
      'nonBlueprintBorderEnabled',
      'nonBlueprintHighlightEnabled',
      'blueprintColor',
      'nonBlueprintColor'
    ], (result) => {
      extensionToggle.checked = result.extensionEnabled ?? true;
      blueprintBorderToggle.checked = result.blueprintBorderEnabled || false;
      blueprintHighlightToggle.checked = result.blueprintHighlightEnabled || false;
      nonBlueprintBorderToggle.checked = result.nonBlueprintBorderEnabled || false;
      nonBlueprintHighlightToggle.checked = result.nonBlueprintHighlightEnabled || false;
      blueprintColorPicker.value = result.blueprintColor || '#00ff00';
      nonBlueprintColorPicker.value = result.nonBlueprintColor || '#ff0000';
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
        console.error('Error toggling extension:', error);
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
        console.error('Error updating Blueprint color:', error);
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
        console.error('Error updating non-Blueprint color:', error);
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
        console.error('Error resetting colors:', error);
      }
    });

    
    // Get component counts
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getCounts' });
      if (response && response.blueprintCount !== undefined && response.nonBlueprintCount !== undefined) {
        blueprintCountElement.innerHTML = `Found <span class="count">${response.blueprintCount}</span> Blueprint component${response.blueprintCount !== 1 ? 's' : ''}`;
        nonBlueprintCountElement.innerHTML = `Found <span class="count">${response.nonBlueprintCount}</span> non-Blueprint element${response.nonBlueprintCount !== 1 ? 's' : ''}`;
      } else {
        blueprintCountElement.textContent = 'Unable to scan page - try refreshing';
        nonBlueprintCountElement.textContent = '';
      }
    } catch (error) {
      console.error('Error communicating with content script:', error);
      blueprintCountElement.textContent = 'Please refresh the page to use this extension';
      nonBlueprintCountElement.textContent = '';
    }
    
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
        console.error('Error toggling Blueprint border:', error);
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
        console.error('Error toggling Blueprint highlight:', error);
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
        console.error('Error toggling non-Blueprint border:', error);
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
        console.error('Error toggling non-Blueprint highlight:', error);
        // Revert toggle state if message failed
        nonBlueprintHighlightToggle.checked = !enabled;
        chrome.storage.sync.set({ nonBlueprintHighlightEnabled: !enabled });
      }
    });
  });
  