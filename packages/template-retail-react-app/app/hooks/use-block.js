/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'
import {useHistory} from 'react-router-dom'

/*
 * Return truthy if you wish to block. Empty return or false will not block
 *
 * THANK YOU --> https://stackoverflow.com/questions/37849933/react-router-how-to-wait-for-an-async-action-before-route-transition
 */

// NOTE: Use aren't using this hook as intended as we aren't blocking ever, we are using it as a way to 
// overwirte all navigation transition behaviours. We could have done this in the link component as well.
export const useBlock = func => {
    const { block, push, location } = useHistory()
    const lastLocation = useRef()
    const funcRef = useRef()

    funcRef.current = func

    useEffect(() => {
        if (location === lastLocation.current || !funcRef.current) {
            lastLocation.current = location
            return
        }

        lastLocation.current = location

        const unblock = block((location, action) => {
            const doBlock = async () => {
                if (!(await funcRef.current(location, action))) {
                    unblock()
                    push(location)
                }
            }
            doBlock()
            return false
        })
    }, [location, block, push])
}

export default useBlock