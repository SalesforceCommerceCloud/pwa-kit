/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'

/**
 * A hook that exposes helper functions to interact with data stored in local/cookie/memory storage
 *
 * Avaliable helpers:
 * - clearStorage: clears all data that the commerce-sdk-react sets in local/cookie storage
 *
 * @group Helpers
 */
const useStorageHelper = () => {
    const auth = useAuthContext()

    return {
        clearStorage: auth.clearStorage
    }
}

export default useStorageHelper
