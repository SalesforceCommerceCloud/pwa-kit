/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Types 
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'

// Local
import {ApplicationExtension as ApplicationExtensionBase} from '../..'
// import APPLICATION_EXTENSIONS from '../../assets/application-extensions-placeholder'
// console.log('import APPLICATION_EXTENSIONS: ', APPLICATION_EXTENSIONS)
// TODO: Move these to the global types folder.
interface ApplicationExtensionConfig extends ApplicationExtensionConfigBase {}
interface ApplicationExtension<T extends ApplicationExtensionConfigBase> extends ApplicationExtensionBase<T> {}

// export const getApplicationExtensions = <T extends ApplicationExtension<ApplicationExtensionConfig>>(): ApplicationExtension<ApplicationExtensionConfig>[] => {
//     console.log('getApplicationExtensions: ', APPLICATION_EXTENSIONS)
//     // Search for the matching extension in the array
//     return APPLICATION_EXTENSIONS as T[]
// }


// class O {}
// class A extends O {}
// class B extends O {}

// const getArray2 = <T extends O>(): T[] => {
//     return [new B() as T]
// }