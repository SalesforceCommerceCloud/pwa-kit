/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import {useCommerceAPI} from '../contexts'

const useEinstein = () => {
    const api = useCommerceAPI()
    const [state, setState] = useState({loading: false, recommendations: []})

    return {
        ...state,

        api: api.einstein,

        async sendViewProduct(...args) {
            return api.einstein.sendViewProduct(...args)
        },
        async sendViewSearch(...args) {
            return api.einstein.sendViewSearch(...args)
        },
        async sendClickSearch(...args) {
            return api.einstein.sendClickSearch(...args)
        },
        async sendViewCategory(...args) {
            return api.einstein.sendViewCategory(...args)
        },
        async sendClickCategory(...args) {
            return api.einstein.sendClickCategory(...args)
        },
        async sendViewPage(...args) {
            return api.einstein.sendViewPage(...args)
        },
        async sendBeginCheckout(...args) {
            return api.einstein.sendBeginCheckout(...args)
        },
        async sendCheckoutStep(...args) {
            return api.einstein.sendCheckoutStep(...args)
        },
        async sendViewReco(...args) {
            return api.einstein.sendViewReco(...args)
        },
        async sendClickReco(...args) {
            return api.einstein.sendClickReco(...args)
        },
        async sendAddToCart(...args) {
            return api.einstein.sendAddToCart(...args)
        },
        async getRecommenders(...args) {
            return api.einstein.getRecommenders(...args)
        },
        async getRecommendations(...args) {
            setState((s) => ({...s, loading: true}))
            const recommendations = await api.einstein.getRecommendations(...args)
            setState({loading: false, recommendations})
        },
        async getZoneRecommendations(...args) {
            setState((s) => ({...s, loading: true}))
            const recommendations = await api.einstein.getZoneRecommendations(...args)
            setState({loading: false, recommendations})
        }
    }
}

export default useEinstein
