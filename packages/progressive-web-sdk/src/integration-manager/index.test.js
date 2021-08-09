/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-disable max-nested-callbacks */

import {registerConnector} from './index'

const connectorFunction = () => {}
let registeredConnector = {
    commands: {
        testFn: connectorFunction
    }
}

beforeEach(() => {
    // Reset registeredConnector
    registeredConnector = {
        commands: {
            testFn: connectorFunction
        }
    }
})

describe('mergeCommands', () => {
    test('Passing an undefined extension should result in the registeredConnectors command count remaining the same.', () => {
        registerConnector(registeredConnector)

        expect(Object.keys(registeredConnector.commands).length).toEqual(1)
    })

    test('Passing an extension with a 1 new commands should result in the registeredConnector command count increasing by 1', () => {
        registerConnector(registeredConnector, {
            commandOverrides: {
                newTestFn: () => {}
            }
        })

        expect(Object.keys(registeredConnector.commands).length).toEqual(2)
        expect(typeof registeredConnector.commands.newTestFn).toEqual('function')
    })

    test('Passing an extension with multiple new commands should result in the registeredConnector command count increasing by that number', () => {
        registerConnector(registeredConnector, {
            commandOverrides: {
                newTestFn1: () => {},
                newTestFn2: () => {},
                newTestFn3: () => {}
            }
        })

        expect(Object.keys(registeredConnector.commands).length).toEqual(4)
        expect(typeof registeredConnector.commands.newTestFn1).toEqual('function')
        expect(typeof registeredConnector.commands.newTestFn2).toEqual('function')
        expect(typeof registeredConnector.commands.newTestFn3).toEqual('function')
    })

    test('Passing an extension with 1 existing command should result in the registeredConnectors command count staying the same', () => {
        const overrideFn = () => {}
        registerConnector(registeredConnector, {
            commandOverrides: {
                testFn: overrideFn
            }
        })

        expect(Object.keys(registeredConnector.commands).length).toEqual(1)
        expect(registeredConnector.commands.testFn).toBe(overrideFn)
    })

    test('Passing an extension with 1 custom command should result in the registeredConnectors having 1 custom command of the same name', () => {
        registerConnector(registeredConnector, {
            commands: {
                testFn1: () => {}
            }
        })

        expect(Object.keys(registeredConnector.commands.custom).length).toEqual(1)
        expect(typeof registeredConnector.commands.custom.testFn1).toEqual('function')
    })
})
