const {TestWithPlaywrightTool} = require('../utils/run-site-test-tool.js')

// Mock the imported test functions to avoid running real Playwright tests
jest.mock('../tests/performance.test.js', () => ({
    runPerformanceTest: jest.fn(async (url) => ({mock: 'performance', url}))
}))
jest.mock('../tests/accessibility.test.js', () => ({
    runAccessibilityTest: jest.fn(async (url) => ({mock: 'accessibility', url}))
}))

const DEFAULT_SITE_URL = 'https://www.adidas.com/us'

describe('TestWithPlaywrightTool', () => {
    let tool
    beforeEach(() => {
        tool = new TestWithPlaywrightTool()
    })

    it('runs performance test with provided siteUrl', async () => {
        const result = await tool.run('performance', 'https://example.com')
        expect(result).toEqual({mock: 'performance', url: 'https://example.com'})
    })

    it('runs performance test with default siteUrl if not provided', async () => {
        // Remove the error throw for missing siteUrl in your implementation if you want this to pass
        const result = await tool.run('performance')
        expect(result).toEqual({mock: 'performance', url: DEFAULT_SITE_URL})
    })

    it('throws error if testType is unsupported', async () => {
        const result = await tool.run('unknown', 'https://example.com')
        expect(result).toEqual({error: 'unsupported test type'})
    })

    it('runs accessibility test with provided siteUrl', async () => {
        const result = await tool.run('accessibility', 'https://foo.com')
        expect(result).toEqual({mock: 'accessibility', url: 'https://foo.com'})
    })

    it('runs accessibility test with default siteUrl if not provided', async () => {
        const result = await tool.run('accessibility')
        expect(result).toEqual({mock: 'accessibility', url: DEFAULT_SITE_URL})
    })
})
