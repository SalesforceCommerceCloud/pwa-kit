/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    // Add your story files here when ready
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.mdx'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // Add any custom Vite configuration here
    return config;
  },
};

module.exports = config;
