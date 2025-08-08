import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../src/theme';

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
      <ChakraProvider value={theme}>
        <div style={{ padding: '1rem' }}>
          <Story />
        </div>
      </ChakraProvider>
    ),
  ],
};

export default preview;
