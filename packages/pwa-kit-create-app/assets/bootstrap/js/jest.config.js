const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    // Empty array to ensure no files are ignored
    transformIgnorePatterns: [],
};