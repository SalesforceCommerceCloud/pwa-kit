/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {useState} from 'react'
import {useCommerceAPI} from '../utils'

const useEinstein = () => {
    const api = useCommerceAPI()
    const [state, setState] = useState({loading: false, recommendations: []})

    return {
        ...state,

        api: api.einstein,

        async sendViewProduct(...args) {
            return api.einstein.sendViewProduct(...args)
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
