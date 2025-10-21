// Content script to highlight Blueprint components

const BLUEPRINT_HIGHLIGHT_CLASS = 'bp-extension-blueprint-highlight';
const NON_BLUEPRINT_HIGHLIGHT_CLASS = 'bp-extension-non-blueprint-highlight';
const BLUEPRINT_BORDER_CLASS = 'bp-extension-blueprint-border';
const NON_BLUEPRINT_BORDER_CLASS = 'bp-extension-non-blueprint-border';

// Load external CSS file
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('styles.css');
document.head.appendChild(link);

let dynamicStyle = null;

let observerStarted = false;

// Cache last scan results for counts
let lastScanResults = null;

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
    const position = computedStyle.position;
    
    // Determine if highlight can be applied to element
    const canHighlight = position === 'static' || position === 'relative';
    
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
  const blueprintHighlightElements = document.querySelectorAll(`.${BLUEPRINT_HIGHLIGHT_CLASS}`);
  const nonBlueprintHighlightElements = document.querySelectorAll(`.${NON_BLUEPRINT_HIGHLIGHT_CLASS}`);
  const blueprintBorderElements = document.querySelectorAll(`.${BLUEPRINT_BORDER_CLASS}`);
  const nonBlueprintBorderElements = document.querySelectorAll(`.${NON_BLUEPRINT_BORDER_CLASS}`);
  
  [...blueprintHighlightElements, ...nonBlueprintHighlightElements].forEach(element => {
    element.classList.remove(BLUEPRINT_HIGHLIGHT_CLASS, NON_BLUEPRINT_HIGHLIGHT_CLASS);
  });
  
  [...blueprintBorderElements, ...nonBlueprintBorderElements].forEach(element => {
    element.classList.remove(BLUEPRINT_BORDER_CLASS, NON_BLUEPRINT_BORDER_CLASS);
  });
}

function updateColors() {
  try {
    chrome.storage.sync.get(['blueprintColor', 'nonBlueprintColor'], (colors) => {
      const blueprintColor = colors.blueprintColor || '#00ff00';
      const nonBlueprintColor = colors.nonBlueprintColor || '#ff0000';
      
      // Convert hex to rgba for highlights (fixed opacity values)
      const blueprintRgba = hexToRgba(blueprintColor, 0.1); // 10% opacity
      const nonBlueprintRgba = hexToRgba(nonBlueprintColor, 0.01); // 1% opacity
      
      // Create dynamic style element if it doesn't exist
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'bp-extension-dynamic-colors';
        document.head.appendChild(dynamicStyle);
      }
      
      dynamicStyle.textContent = `
        .${BLUEPRINT_BORDER_CLASS} {
          border-color: ${blueprintColor} !important;
        }
        .${BLUEPRINT_HIGHLIGHT_CLASS}::after {
          background-color: ${blueprintRgba} !important;
        }
        .${NON_BLUEPRINT_BORDER_CLASS} {
          border-color: ${nonBlueprintColor} !important;
        }
        .${NON_BLUEPRINT_HIGHLIGHT_CLASS}::after {
          background-color: ${nonBlueprintRgba} !important;
        }
      `;
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
    chrome.storage.sync.get([
      'extensionEnabled',
      'blueprintBorderEnabled',
      'blueprintHighlightEnabled',
      'nonBlueprintBorderEnabled',
      'nonBlueprintHighlightEnabled'
    ], (flags) => {
    if (!flags.extensionEnabled) {
      // Extension toggled OFF: remove everything and stop observing
      if (observerStarted && observer) {
        observer.disconnect();
        observerStarted = false;
      }
      removeAllVisualizationClasses();
      
      // Remove dynamic style element when extension is disabled
      if (dynamicStyle) {
        dynamicStyle.remove();
        dynamicStyle = null;
      }
      return;
    }

    // Extension toggled ON: ensure observing
    if (!observerStarted && observer && document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
      observerStarted = true;
    }

    const categories = scanAndCategorizeElements();
    lastScanResults = categories; // Cache results for counts
    
    // Update colors before applying classes
    updateColors();
    
    // Blueprint border
    if (flags.blueprintBorderEnabled) {
      addClassToElements([
        ...categories.blueprint.highlightable,
        ...categories.blueprint.borderOnly
      ], BLUEPRINT_BORDER_CLASS);
    } else {
      removeClassBySelector(`.${BLUEPRINT_BORDER_CLASS}`, BLUEPRINT_BORDER_CLASS);
    }

    // Blueprint highlight
    if (flags.blueprintHighlightEnabled) {
      categories.blueprint.highlightable.forEach(el => {
        el.classList.add(BLUEPRINT_HIGHLIGHT_CLASS);
      });
    } else {
      removeClassBySelector(`.${BLUEPRINT_HIGHLIGHT_CLASS}`, BLUEPRINT_HIGHLIGHT_CLASS);
    }

    // Non-Blueprint border
    if (flags.nonBlueprintBorderEnabled) {
      addClassToElements([
        ...categories.nonBlueprint.highlightable,
        ...categories.nonBlueprint.borderOnly
      ], NON_BLUEPRINT_BORDER_CLASS);
    } else {
      removeClassBySelector(`.${NON_BLUEPRINT_BORDER_CLASS}`, NON_BLUEPRINT_BORDER_CLASS);
    }

    // Non-Blueprint highlight
    if (flags.nonBlueprintHighlightEnabled) {
      categories.nonBlueprint.highlightable.forEach(el => {
        el.classList.add(NON_BLUEPRINT_HIGHLIGHT_CLASS);
      });
    } else {
      removeClassBySelector(`.${NON_BLUEPRINT_HIGHLIGHT_CLASS}`, NON_BLUEPRINT_HIGHLIGHT_CLASS);
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
    if (request.action === 'toggleBlueprintBorder' ||
        request.action === 'toggleBlueprintHighlight' ||
        request.action === 'toggleNonBlueprintBorder' ||
        request.action === 'toggleNonBlueprintHighlight' ||
        request.action === 'toggleExtension') {
      // Flags are saved by the popup; just recompute once here
      updateVisualization();
      sendResponse({ success: true });
    } else if (request.action === 'updateColors') {
      // Update colors immediately (handles both color and opacity changes)
      updateColors();
      sendResponse({ success: true });
    } else if (request.action === 'getCounts') {
      chrome.storage.sync.get(['extensionEnabled'], (flags) => {
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
      });
    }
  } catch (error) {
    console.log('Extension context invalidated, stopping execution');
    sendResponse({ success: false, error: 'Extension context invalidated' });
  }
  return true;
});

// Initialize extension with default values on first load
function initializeExtension() {
  try {
    chrome.storage.sync.get([
      'extensionEnabled',
      'blueprintBorderEnabled', 
      'blueprintHighlightEnabled', 
      'nonBlueprintBorderEnabled', 
      'nonBlueprintHighlightEnabled',
      'blueprintColor',
      'nonBlueprintColor'
    ], (result) => {
      // Set default values if they don't exist (first load)
      const defaults = {
        extensionEnabled: true,
        blueprintBorderEnabled: false,
        blueprintHighlightEnabled: false,
        nonBlueprintBorderEnabled: false,
        nonBlueprintHighlightEnabled: false,
        blueprintColor: '#00ff00',
        nonBlueprintColor: '#ff0000'
      };
      
      // Check if this is first load (no saved data)
      const isFirstLoad = Object.values(result).every(value => value === undefined);
      
      if (isFirstLoad) {
        // Save defaults to storage
        chrome.storage.sync.set(defaults);
        console.log('First load detected, initializing with defaults');
      }
      
      // Use saved values or defaults
      const settings = {
        extensionEnabled: result.extensionEnabled ?? defaults.extensionEnabled,
        blueprintBorderEnabled: result.blueprintBorderEnabled ?? defaults.blueprintBorderEnabled,
        blueprintHighlightEnabled: result.blueprintHighlightEnabled ?? defaults.blueprintHighlightEnabled,
        nonBlueprintBorderEnabled: result.nonBlueprintBorderEnabled ?? defaults.nonBlueprintBorderEnabled,
        nonBlueprintHighlightEnabled: result.nonBlueprintHighlightEnabled ?? defaults.nonBlueprintHighlightEnabled,
        blueprintColor: result.blueprintColor ?? defaults.blueprintColor,
        nonBlueprintColor: result.nonBlueprintColor ?? defaults.nonBlueprintColor
      };
      
      // Apply settings
      updateVisualization();
      updateColors();
    });
  } catch (error) {
    console.log('Extension context invalidated, stopping execution');
  }
}

// Initialize on load
initializeExtension();

// Watch for dynamic content changes
let observerTimeout;
const observer = new MutationObserver((mutations) => {
  // Debounce rapid mutations to avoid performance issues
  clearTimeout(observerTimeout);
  observerTimeout = setTimeout(() => {
    try {
      chrome.storage.sync.get(['extensionEnabled'], (result) => {
        // Only process mutations that might contain new elements
        const hasRelevantChanges = mutations.some(mutation => 
          mutation.type === 'childList' && 
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
        );
        
        if (hasRelevantChanges && result.extensionEnabled) {
          updateVisualization();
        }
      });
    } catch (error) {
      console.log('Extension context invalidated, stopping observer');
      observer.disconnect();
    }
  }, 100); // 100ms debounce
});
