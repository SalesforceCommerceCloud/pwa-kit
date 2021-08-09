/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

describe('DebugInfo conditional exports', () => {
    let originalEnv, ProdComponent, DevComponent

    beforeEach(() => {
        ProdComponent = require('./debug-info-prod').default
        DevComponent = require('./debug-info-dev').default
        originalEnv = process.env.NODE_ENV
    })

    afterEach(() => {
        process.env.NODE_ENV = originalEnv
        jest.resetModules()
    })

    test('Should export a no-op component when NODE_ENV === production', () => {
        process.env.NODE_ENV = 'production'
        const prod = require('./index').default
        expect(prod).toBe(ProdComponent)
    })

    test('Should export a dev-mode tool when NODE_ENV !== production', () => {
        process.env.NODE_ENV = 'development'
        const dev = require('./index').default
        expect(dev).toBe(DevComponent)
    })
})
