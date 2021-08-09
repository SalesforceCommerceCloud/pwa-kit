/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import makeServiceWorkerEnv from 'service-worker-mock'

describe('Service worker', () => {
    beforeEach(() => {
        const url = 'https://www.example.com'
        Object.assign(global, makeServiceWorkerEnv({locationUrl: url}))
        global.jsdom.reconfigure({
            url: url
        })
        jest.resetModules()
    })

    it('should add listeners', () => {
        require('./test-entrypoint')
        expect(self.listeners.install).toBeDefined()
        expect(self.listeners.activate).toBeDefined()
        expect(self.listeners.fetch).toBeDefined()
        expect(self.listeners.message).toBeDefined()
    })
})
