// Jest setup file to ensure proper cleanup of async operations

// Clean up any remaining timers
afterAll(() => {
    // Clear any remaining timers
    jest.clearAllTimers()
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc()
    }
    
    // Close any remaining servers or connections
    // This is a fallback in case any tests didn't properly clean up
    const server = require('net').createServer()
    server.unref()
    
    // Wait a bit for any pending operations to complete
    return new Promise(resolve => setTimeout(resolve, 100))
}) 