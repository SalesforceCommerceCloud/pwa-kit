/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import * as commands from './commands'
import * as reducer from './reducer'
import merge from 'lodash.merge'

let registeredConnector = {}

const mergeCommands = (registeredConnector = {}, extension = {}) => {
    // Merge into a new object as the commands properties are created with
    // `Object.defineProperty` thanks to babel and can't be overridden.
    return merge(
        {},
        registeredConnector.commands,
        {
            ...extension.commandOverrides
        },
        extension.commands ? {custom: extension.commands} : undefined
    )
}

export const registerConnector = (connector = {}, extension = {}) => {
    registeredConnector = connector
    if (extension) {
        registeredConnector.commands = mergeCommands(registeredConnector, extension)
    }
    if (registeredConnector.commands.custom) {
        commands.registerCustom(registeredConnector.commands.custom)
    }
    commands.register(registeredConnector.commands)
    reducer.register(registeredConnector.reducer)
}

export const registerConnectorExtension = (extension) => {
    console.warn(`registerConnectorExtension has been deprecated.
        See https://docs.mobify.com/progressive-web/latest/guides/integration-manager/extending-a-connector/#section-register-extension
        for details on how extensions should be registered.`)
    registeredConnector.commands = mergeCommands(registeredConnector, extension)

    commands.register(registeredConnector.commands)
    commands.registerCustom(registeredConnector.commands.custom)
}

// this isn't necessary, just useful
export {commands, reducer}
