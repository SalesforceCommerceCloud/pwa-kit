module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['node_modules', 'dist'],
    collectCoverageFrom: ['src/**/*.{js,jsx}', '!node_modules/**'],
    coverageThreshold: {
        global: {
            statements: 72.0,
            branches: 66.0,
            functions: 67.0,
            lines: 74.0
        }
    },
    setupFilesAfterEnv: ['./jest-setup.js'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': './jest-babel-transform.js'
    }
}
