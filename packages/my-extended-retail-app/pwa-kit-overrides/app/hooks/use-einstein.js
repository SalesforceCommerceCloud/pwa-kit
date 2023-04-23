/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import _useEinstein, {EinsteinAPI as _EinsteinAPI} from '^retail-react-app/app/hooks/use-einstein'

export class EinsteinAPI extends _EinsteinAPI {
    async sendSomeEvent() {
        console.log('--- Einstein: sending some event')
    }
}

const useEinstein = () => {
    const einstein = _useEinstein(EinsteinAPI)

    return {
        ...einstein,
        async sendViewPage(...args) {
            console.log(
                '--- can send pageview event to other analytics providers, by piggy backing on existing implementation'
            )
            return einstein._instance.sendViewPage(...args)
        },
        // Unfortunately, it does not look like Einstein API allows you to send your own custom events.
        // But if it does allow, this is what it would like to extend by adding more kinds of events.
        async sendSomeEvent(...args) {
            return einstein._instance.sendSomeEvent(...args)
        }
    }
}

export default useEinstein
