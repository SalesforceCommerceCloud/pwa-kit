/**
 * scripts/common.test.js imports prompt, which has a dependency on winston, which
 * has a dependency on pkginfo. Since mocks are hoisted in test files, mocking fs
 * and prompt will cause pkginfo to fail to run (since it requires actual methods
 * in fs).
 * To get around this, we provide the real methods that pkginfo needs to run.
 */

// Import the actual fs module
const _fs = require.requireActual('fs')

// Generate a mocked fs module
const fs = jest.genMockFromModule('fs')

// Re-attach the actual fs methods for those methods that pkginfo needs
fs.readdirSync = _fs.readdirSync
fs.readFileSync = _fs.readFileSync

module.exports = fs
