/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'

interface useDntReturn {
    selectedDnt: boolean | undefined
    dntStatus: boolean | undefined
    effectiveDnt: boolean | undefined
    updateDNT: (preference: boolean | null) => Promise<void>
    updateDnt: (preference: boolean | null) => Promise<void>
}

/**
 * @group Helpers
 * @category DNT
 *
 * @returns {Object} - The returned object containing DNT states and function to update preference
 * @property {boolean} selectedDnt - DNT user preference. Used to determine
 *              if the consent tracking form should be rendered
 * @property {boolean} effectiveDnt - effective DNT value to apply to
 *              analytics layers. Takes defaultDnt into account when selectedDnt is undefined.
 *              If defaultDnt is undefined as well, then SDK default is used.
 * @property {function} updateDnt - takes a DNT choice and creates the dw_dnt
 *              cookie and reauthorizes with SLAS
 * @property {function} updateDNT - @deprecated Deprecated since version 3.1.0. Use updateDnt instead.
 * @property {boolean} dntStatus - @deprecated Deprecated since version 3.1.0. Use selectedDnt instead.
 *
 *
 */
const useDNT = (): useDntReturn => {
    const auth = useAuthContext()
    const selectedDnt = auth.getDnt()
    const effectiveDnt = auth.getDnt({
        includeDefaults: true
    })
    const updateDnt = async (preference: boolean | null) => {
        await auth.setDnt(preference)
    }
    const updateDNT = updateDnt
    const dntStatus = selectedDnt

    return {
        selectedDnt,
        effectiveDnt,
        dntStatus,
        updateDNT,
        updateDnt
    }
}

export default useDNT
