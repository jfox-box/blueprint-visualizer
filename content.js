// Load external CSS file
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(link);

let dynamicStyle = null;
let observerStarted = false;
let lastScanResults = null; // Cache last scan results for counts

function scanAndCategorizeElements() {
  const allElements = document.querySelectorAll('*');
  const categories = {
    blueprint: {
      highlightable: [],
      borderOnly: []
    },
    nonBlueprint: {
      highlightable: [],
      borderOnly: []
    }
  };
  
  allElements.forEach(element => {
    const isBlueprint = [...element.classList].some(className => className.startsWith('bp_'));
    const computedStyle = window.getComputedStyle(element);
    
    // highlight relies on positioning styles, so it can only be applied to static or relative elements
    const canHighlight = computedStyle.position === 'static' || computedStyle.position === 'relative';
    
    if (isBlueprint) {
      if (canHighlight) {
        categories.blueprint.highlightable.push(element);
      } else {
        categories.blueprint.borderOnly.push(element);
      }
    } else {
      if (canHighlight) {
        categories.nonBlueprint.highlightable.push(element);
      } else {
        categories.nonBlueprint.borderOnly.push(element);
      }
    }
  });
  
  return categories;
}

function addClassToElements(elements, className) {
  elements.forEach(el => {
    el.classList.add(className);
  });
}

function removeClassBySelector(selector, className) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.classList.remove(className);
  });
}

function removeAllVisualizationClasses() {
  Object.values(CLASSES).forEach(className => {
    const elements = document.querySelectorAll(`.${className}`);
    elements.forEach(element => {
      element.classList.remove(className);
    });
  });
}

function updateColors() {
  try {
    chrome.storage.sync.get(['blueprintColor', 'nonBlueprintColor'], (colors) => {
      try {
        const blueprintColor = colors.blueprintColor || '#00ff00';
        const nonBlueprintColor = colors.nonBlueprintColor || '#ff0000';
        
        // Convert hex to rgba for highlights (fixed opacity values)
        const blueprintRgba = hexToRgba(blueprintColor, OPACITY.BLUEPRINT);
        const nonBlueprintRgba = hexToRgba(nonBlueprintColor, OPACITY.NON_BLUEPRINT);
        
        // Create dynamic style element if it doesn't exist
        if (!dynamicStyle) {
          dynamicStyle = document.createElement('style');
          dynamicStyle.id = 'bp-extension-dynamic-colors';
          document.head.appendChild(dynamicStyle);
        }
        
        dynamicStyle.textContent = `
          .${CLASSES.BLUEPRINT_BORDER} {
            border-color: ${blueprintColor} !important;
          }
          .${CLASSES.BLUEPRINT_HIGHLIGHT}::after {
            background-color: ${blueprintRgba} !important;
          }
          .${CLASSES.NON_BLUEPRINT_BORDER} {
            border-color: ${nonBlueprintColor} !important;
          }
          .${CLASSES.NON_BLUEPRINT_HIGHLIGHT}::after {
            background-color: ${nonBlueprintRgba} !important;
          }
        `;
      } catch (error) {
        console.log('Extension context invalidated in updateColors callback');
        return;
      }
    });
  } catch (error) {
    console.log('Extension context invalidated, stopping execution');
    return;
  }
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateVisualization() {
  try {
    chrome.storage.sync.get(STORAGE_KEYS, (flags) => {
      try {
        if (!flags.extensionEnabled) {
          // Extension toggled OFF: remove everything and stop observing
          cleanup();
          return;
        }
        
        if (!observerStarted && observer && document.body) {
          try {
            observer.observe(document.body, { childList: true, subtree: true });
            observerStarted = true;
          } catch (error) {
            console.log('Failed to start observer:', error);
            observer = null;
          }
        }

        const categories = scanAndCategorizeElements();
        lastScanResults = categories; // Cache results for counts
        
        // Update colors before applying classes
        updateColors();
        
        // Apply classes based on settings
        const settings = [
          { enabled: flags.blueprintBorderEnabled, type: 'blueprint', class: CLASSES.BLUEPRINT_BORDER, allElements: true },
          { enabled: flags.blueprintHighlightEnabled, type: 'blueprint', class: CLASSES.BLUEPRINT_HIGHLIGHT, allElements: false },
          { enabled: flags.nonBlueprintBorderEnabled, type: 'nonBlueprint', class: CLASSES.NON_BLUEPRINT_BORDER, allElements: true },
          { enabled: flags.nonBlueprintHighlightEnabled, type: 'nonBlueprint', class: CLASSES.NON_BLUEPRINT_HIGHLIGHT, allElements: false }
        ];

        settings.forEach(setting => {
          if (setting.enabled) {
            const elements = setting.allElements 
              ? [...categories[setting.type].highlightable, ...categories[setting.type].borderOnly]
              : categories[setting.type].highlightable;
            addClassToElements(elements, setting.class);
          } else {
            removeClassBySelector(`.${setting.class}`, setting.class);
          }
        });
      } catch (error) {
        console.log('Extension context invalidated in updateVisualization callback');
        return;
      }
    });
  } catch (error) {
    console.log('Extension context invalidated, stopping execution');
    return;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  try {
    if (request.action === ACTIONS.TOGGLE_BLUEPRINT_BORDER ||
        request.action === ACTIONS.TOGGLE_BLUEPRINT_HIGHLIGHT ||
        request.action === ACTIONS.TOGGLE_NON_BLUEPRINT_BORDER ||
        request.action === ACTIONS.TOGGLE_NON_BLUEPRINT_HIGHLIGHT ||
        request.action === ACTIONS.TOGGLE_EXTENSION) {
      // Flags are saved by the popup; just recompute once here
      updateVisualization();
      sendResponse({ success: true });
    } else if (request.action === ACTIONS.UPDATE_COLORS) {
      // Update colors immediately (handles both color and opacity changes)
      updateColors();
      sendResponse({ success: true });
    } else if (request.action === ACTIONS.GET_COUNTS) {
      try {
        chrome.storage.sync.get(['extensionEnabled'], (flags) => {
          try {
            if (!flags.extensionEnabled) {
              sendResponse({ blueprintCount: 0, nonBlueprintCount: 0 });
            } else if (lastScanResults) {
              const blueprintCount = lastScanResults.blueprint.highlightable.length + lastScanResults.blueprint.borderOnly.length;
              const nonBlueprintCount = lastScanResults.nonBlueprint.highlightable.length + lastScanResults.nonBlueprint.borderOnly.length;
              sendResponse({ 
                blueprintCount: blueprintCount,
                nonBlueprintCount: nonBlueprintCount 
              });
            } else {
              // Fallback: scan if no cached results
              const categories = scanAndCategorizeElements();
              const blueprintCount = categories.blueprint.highlightable.length + categories.blueprint.borderOnly.length;
              const nonBlueprintCount = categories.nonBlueprint.highlightable.length + categories.nonBlueprint.borderOnly.length;
              sendResponse({ 
                blueprintCount: blueprintCount,
                nonBlueprintCount: nonBlueprintCount 
              });
            }
          } catch (error) {
            console.log('Extension context invalidated in GET_COUNTS callback');
            sendResponse({ success: false, error: 'Extension context invalidated' });
          }
        });
      } catch (error) {
        console.log('Extension context invalidated in GET_COUNTS storage call');
        sendResponse({ success: false, error: 'Extension context invalidated' });
      }
    }
  } catch (error) {
    console.log('Extension context invalidated, attempting recovery');
    sendResponse({ success: false, error: 'Extension context invalidated' });
  }
  return true;
});

// Initialize extension with default values on first load
function initializeExtension() {
  try {
    chrome.storage.sync.get(STORAGE_KEYS, (result) => {
      try {
        // Check if this is first load (no saved data)
        const isFirstLoad = Object.values(result).every(value => value === undefined);
        
        if (isFirstLoad) {
          // Save defaults to storage
          chrome.storage.sync.set(DEFAULTS);
          console.log('First load detected, initializing with defaults');
        }
        
        // Apply settings
        updateVisualization();
        updateColors();
      } catch (error) {
        console.log('Extension context invalidated in initializeExtension callback');
      }
    });
  } catch (error) {
    console.log('Extension context invalidated, stopping execution');
  }
}

// Initialize on load
initializeExtension();

// Watch for dynamic content changes
let observerTimeout;
let observer = null;

// Create observer with improved error handling and cleanup
function createObserver() {
  try {
    observer = new MutationObserver((mutations) => {
      // Debounce rapid mutations to avoid performance issues
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        try {
          // Check if extension context is still valid
          if (!chrome.runtime?.id) {
            console.log('Extension context invalidated, stopping observer');
            cleanup();
            return;
          }
          
          chrome.storage.sync.get(['extensionEnabled'], (result) => {
            try {
              // Only process mutations that might contain new elements
              const hasRelevantChanges = mutations.some(mutation => 
                mutation.type === 'childList' && 
                (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
              );
              
              if (hasRelevantChanges && result.extensionEnabled) {
                updateVisualization();
              }
            } catch (error) {
              console.log('Extension context invalidated in storage callback');
              cleanup();
            }
          });
        } catch (error) {
          console.log('Extension context invalidated, stopping observer');
          cleanup();
        }
      }, 100); // 100ms debounce
    });
    return true;
  } catch (error) {
    console.log('Failed to create MutationObserver:', error);
    return false;
  }
}

// Cleanup function
function cleanup() {
  if (observer) {
    try {
      observer.disconnect();
    } catch (error) {
      console.log('Error disconnecting observer:', error);
    }
    observer = null;
  }
  observerStarted = false;
  
  // Clear any pending timeouts
  if (observerTimeout) {
    clearTimeout(observerTimeout);
    observerTimeout = null;
  }
  
  // Remove dynamic styles
  if (dynamicStyle) {
    dynamicStyle.remove();
    dynamicStyle = null;
  }
  
  // Remove all visualization classes
  removeAllVisualizationClasses();
}

// Initialize observer
createObserver();

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
