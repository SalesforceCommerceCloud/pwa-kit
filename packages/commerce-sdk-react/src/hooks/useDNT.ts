/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'

interface useDntReturn {
    dntStatus: boolean | undefined
    updateDNT: (preference: boolean | null, domain?: string | undefined) => Promise<void>
}

/**
 * Hook that returns
 * dntStatus - a boolean indicating the current DNT preference
 * updateDNT - a function that takes a DNT preference and creates the dw_dnt
 *              cookie and reauthroizes with SLAS
 *
 * @group Helpers
 * @category DNT
 *
 */
const useDNT = (): useDntReturn => {
    const auth = useAuthContext()
    const dntStatus = auth.getDnt()
    const updateDNT = async (preference: boolean | null, domain?: string | undefined) => {
        await auth.setDnt(preference, domain)
    }

    return {dntStatus, updateDNT}
}

export default useDNT
