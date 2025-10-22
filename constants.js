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

const TIMING = {
  DEBOUNCE_MS: 100,
  POPUP_DELAY_MS: 100
};

const STYLES = {
  Z_INDEX: 9999
};

