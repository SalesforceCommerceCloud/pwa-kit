import {makeErrorHandler} from './build-dev-server'

describe('Error handlers returned from makeErrorHandler', () => {
    const testServerErrorHandler = (error, times) => {
        const exit = jest.fn()
        const proc = {exit}
        const close = jest.fn()
        const devserver = {close}
        const log = jest.fn()
        const handler = makeErrorHandler(proc, devserver, log)
        const e = {code: error}

        handler(e)
        expect(close).toHaveBeenCalledTimes(times)
    }

    test('should exit the current process if the requested port is in use', () => {
        testServerErrorHandler('EADDRINUSE', 1)
    })

    test('should ignore errors other than EADDRINUSE', () => {
        testServerErrorHandler('EACCES', 0)
    })
})