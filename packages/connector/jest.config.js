module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['node_modules', 'dist'],
    collectCoverageFrom: ['src/**/*.{js,jsx}', '!node_modules/**'],
    coverageThreshold: {
        global: {
            statements: 95,
            branches: 75,
            functions: 100,
            lines: 95
        }
    }
}
