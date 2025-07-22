// src/core/design-mode-style.ts

export const DESIGN_MODE_CSS = `
  .pd-smart-component:hover {
    outline: 2px solid #0070d2;
    box-shadow: 0 0 10px rgba(0, 112, 210, 0.5);
  }

  .pd-smart-component.pd-selected {
    outline: 2px solid #0050a0;
  }

  .pd-smart-component > * {
    pointer-events: none;
  }

  .pd-drop-region.pd-drop-active {
    outline: 2px solid #1db954 !important;
    position: relative;
  }
  .pd-drop-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: #1db954;
    z-index: 10;
  }
  .pd-drop-indicator--above .pd-drop-line--above {
    top: 0;
  }
  .pd-drop-indicator--below .pd-drop-line--below {
    bottom: 0;
  }
`
