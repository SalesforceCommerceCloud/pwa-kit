module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['node_modules', 'dist'],
    collectCoverageFrom: ['src/**/*.{js,jsx}', 'scripts/**/*.{js,jsx}', '!node_modules/**'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': './jest-babel-transform.js'
    }
}
