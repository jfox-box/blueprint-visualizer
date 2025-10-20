// Popup script to control Blueprint component highlighting

document.addEventListener('DOMContentLoaded', async () => {
    const extensionToggle = document.getElementById('toggleExtension');
    const blueprintBorderToggle = document.getElementById('toggleBlueprintBorder');
    const blueprintHighlightToggle = document.getElementById('toggleBlueprintHighlight');
    const nonBlueprintBorderToggle = document.getElementById('toggleNonBlueprintBorder');
    const nonBlueprintHighlightToggle = document.getElementById('toggleNonBlueprintHighlight');
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
      'nonBlueprintHighlightEnabled'
    ], (result) => {
      extensionToggle.checked = result.extensionEnabled ?? true;
      blueprintBorderToggle.checked = result.blueprintBorderEnabled || false;
      blueprintHighlightToggle.checked = result.blueprintHighlightEnabled || false;
      nonBlueprintBorderToggle.checked = result.nonBlueprintBorderEnabled || false;
      nonBlueprintHighlightToggle.checked = result.nonBlueprintHighlightEnabled || false;

      // Disable/enable other toggles based on extensionEnabled
      const disabled = !(result.extensionEnabled ?? true);
      blueprintBorderToggle.disabled = disabled;
      blueprintHighlightToggle.disabled = disabled;
      nonBlueprintBorderToggle.disabled = disabled;
      nonBlueprintHighlightToggle.disabled = disabled;
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

      // Immediately reflect disable state in UI
      const disabled = !enabled;
      blueprintBorderToggle.disabled = disabled;
      blueprintHighlightToggle.disabled = disabled;
      nonBlueprintBorderToggle.disabled = disabled;
      nonBlueprintHighlightToggle.disabled = disabled;
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
  