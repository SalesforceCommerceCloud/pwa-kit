# Storybook + Vite Integration for PWA Kit

This document describes the integration of Storybook with Vite in the PWA Kit repository.

## Overview

Storybook has been integrated with Vite to provide a development environment for component documentation and testing. This integration allows developers to:

- View and interact with components in isolation
- Test component variations and states
- Document component usage and props
- Develop components with hot reloading

## Configuration Files

### `.storybook/main.js`
Main Storybook configuration that:
- Uses Vite as the builder
- Configures story discovery patterns for the monorepo structure
- Sets up addons for interactions, links, and essentials

### `.storybook/preview.js`
Preview configuration that:
- Sets up global decorators for Chakra UI and React Router
- Configures controls and actions
- Provides fullscreen layout by default

### `.storybook/manager.js`
Manager configuration that:
- Sets dark theme for the Storybook UI
- Configures sidebar and toolbar options

### `vite.config.js`
Vite configuration that:
- Sets up React plugin
- Configures module resolution for the monorepo
- Optimizes dependencies

## Available Scripts

- `npm run storybook` - Start Storybook development server on port 6006
- `npm run build-storybook` - Build Storybook for production

## Story Structure

When you're ready to add stories, organize them by component and follow this pattern:
```
packages/template-chakra-storefront/src/components/[component-name]/[ComponentName].stories.jsx
```

## Example Stories

*Note: Sample stories have been removed. Add your own stories when ready.*

## Adding New Stories

1. Create a `.stories.jsx` file in your component directory
2. Import your component and React
3. Export a default configuration with:
   - `title`: Component category and name
   - `component`: The component to document
   - `parameters`: Documentation and configuration
   - `argTypes`: Control configurations for props

4. Export story variants as named exports

Example:
```jsx
import React from 'react';
import MyComponent from './index';

export default {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: {
    docs: {
      description: {
        component: 'Description of your component'
      }
    }
  },
  argTypes: {
    // Define controls for your props
  }
};

export const Default = {
  args: {
    // Default props
  }
};
```

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure components are properly imported with relative paths
2. **Chakra UI**: Make sure ChakraProvider is available in the preview decorators
3. **React Router**: Components that use routing need BrowserRouter in decorators
4. **Dependencies**: Install missing dependencies with `npm install --save-dev`

### Node.js Version

Storybook requires Node.js 20 or higher. If you're using Node.js 18, you may need to:
- Upgrade Node.js to version 20+
- Or use the legacy peer deps flag: `npm install --legacy-peer-deps`

## Best Practices

1. **Component Isolation**: Write stories that test components in isolation
2. **Props Documentation**: Use argTypes to document and control component props
3. **Interactive Stories**: Use actions to test event handlers
4. **Accessibility**: Include accessibility labels and test with screen readers
5. **Responsive Design**: Test components at different viewport sizes

## Future Enhancements

- Add more component stories
- Implement visual regression testing
- Add accessibility testing addons
- Create component documentation templates
- Add performance monitoring
