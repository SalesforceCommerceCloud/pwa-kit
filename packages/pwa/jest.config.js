module.exports = {
    testURL: 'http://localhost/',
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['node_modules', 'build'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js'
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx}',
        'non-pwa/**/*.{js,jsx}',
        'worker/**/*.{js,jsx}',
        'scripts/generator/*.{js,jsx}',
        '!app/analytics/**/*.{js,jsx}',
        '!app/pages/test-container/**/*.{js,jsx}',
        '!app/main.jsx',
        '!app/loader.js',
        '!app/ssr.js',
        '!app/static/**',
        '!node_modules/**'
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80
        }
    },
    setupFilesAfterEnv: ['./jest-setup.js'],
    globals: {
        MOBIFY_CONNECTOR_NAME: '',
        AJS_SLUG: '123',
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
