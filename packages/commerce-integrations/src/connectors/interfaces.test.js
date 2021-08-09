/* eslint-disable max-nested-callbacks */

import {CommerceConnector, ParserHooks} from './interfaces'

describe('interfaces', () => {
    test('should not include implementations', () => {
        const instances = [new CommerceConnector(), new ParserHooks()]
        instances.forEach((instance) => {
            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance)).filter(
                (x) => x !== 'constructor'
            )
            methods.forEach((methodName) => {
                expect(() => instance[methodName]()).toThrow(new Error('Not implemented'))
            })
        })
    })
})
