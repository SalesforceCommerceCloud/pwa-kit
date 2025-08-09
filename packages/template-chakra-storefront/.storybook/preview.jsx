import React from 'react';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';

// Create a system using the default configuration
const system = createSystem(defaultConfig);

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ChakraProvider value={system}>
        <BrowserRouter>
          <div style={{ padding: '1rem' }}>
            <Story />
          </div>
        </BrowserRouter>
      </ChakraProvider>
    ),
  ],
};

export default preview;
