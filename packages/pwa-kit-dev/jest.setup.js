// Jest global setup for pwa-kit-dev
import nock from 'nock'

afterEach(() => {
    nock.cleanAll()
})

afterAll(() => {
    // Clean up any remaining timers
    jest.clearAllTimers()
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
    // Wait a bit for any pending operations to complete
    return new Promise(resolve => setTimeout(resolve, 200))
}) 