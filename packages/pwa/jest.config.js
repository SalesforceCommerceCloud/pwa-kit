module.exports = {
    testURL: 'http://localhost/',
    verbose: true,
    collectCoverage: true,
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['node_modules', 'build', 'cypress'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '\\.(svg)$': '<rootDir>/__mocks__/svgMock.js',
        '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js'
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx}',
        'non-pwa/**/*.{js,jsx}',
        'worker/**/*.{js,jsx}',
        'scripts/generator/*.{js,jsx}',
        '!app/pages/test-container/**/*.{js,jsx}',
        '!app/utils/test-utils.js',
        '!app/commerce-api/mocks/*js',
        '!app/main.jsx',
        '!app/loader.js',
        '!app/ssr.js',
        '!app/static/**',
        '!app/theme/**',
        '!node_modules/**'
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 72,
            functions: 78,
            lines: 83
        }
    },
    setupFilesAfterEnv: ['./jest-setup.js'],
    globals: {
        DEBUG: true,
        NODE_ENV: 'test',
        Progressive: {
            buildOrigin: '/mobify/bundle/development/'
        }
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': './jest-babel-transform.js'
    }
}
