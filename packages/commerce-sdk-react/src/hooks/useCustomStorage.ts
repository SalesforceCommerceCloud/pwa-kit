/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'

/**
 * TODO: add documentation
 */
const useCustomStorage = () => {
    const auth = useAuthContext()

    return {
        clearStorage: auth.clearStorage,
        getCustomValue: auth.getCustomValue,
        setCustomValue: auth.setCustomValue,
        deleteCustomValue: auth.deleteCustomValue
    }
}

export default useCustomStorage
