/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {detectStorefrontPreview} from 'pwa-kit-react-sdk/ssr/universal/components/storefront-preview/utils'
import {PREVIEW_CONTEXT_CHANGED_QS_PARAM} from '../constants'
import useNavigation from './use-navigation'
import {useCommerceAPI} from '../commerce-api/contexts'

export default function useStorefrontPreview(opts = {}) {
    const {ampProps} = opts
    const isStorefrontPreviewEnabled = detectStorefrontPreview()
    const api = useCommerceAPI()
    const onClient = typeof window !== 'undefined'
    const location = useLocation()
    const navigate = useNavigation()

    const storefrontPreview = {
        get isEnabled() {
            return isStorefrontPreviewEnabled
        },

        /**
         * Returns the additional search params to be used for storefront preview.
         * For Amplience, we need to add the vse and vse-timestamp params to the url.
         * Replace the timestamp with a placeholder token ({{effectiveDateTimeUnix}}) so that it can be replaced by the
         * storefront preview service with the current timestamp.
         * Ref: https://amplience.com/developers/docs/dev-tools/guides-tutorials/content-previews/
         * An example of the VSE domain is: kuifkfmrgfsv1qjsmei8dbbnq-gvzrfgnzc-1626217200000.staging.bigcontent.io
         * so the additional search params would be:
         * [{
         *     name: 'vse',
         *     value: 'kuifkfmrgfsv1qjsmei8dbbnq-gvzrfgnzc-{{effectiveDateTimeUnix}}.staging.bigcontent.io'
         * },
         * {
         *     name: 'vse-timestamp',
         *     value: '{{effectiveDateTimeUnix}}'
         * }]
         * @returns {{name: string, value: string}[]}
         */
        getAdditionalSearchParams() {
            const config = api.getConfig()
            const {amplience} = config || {}

            let params = [
                {
                    name: PREVIEW_CONTEXT_CHANGED_QS_PARAM,
                    value: '1'
                }
            ]

            // pull vse from ampProps
            let {vse} = ampProps || {}
            let timeMachine = 'gvzrfgnzc'

            // if vse was not present in ampProps, see if we can pull vse from configuration file
            // for example in config/amplience/default.js:
            // envs: [{
            //         name: 'production',
            //         hub: 'sfcccomposable',
            //         vse: 'kuifkfmrgfsv1qjsmei8dbbnq.staging.bigcontent.io',
            //         timeMachine: 'gvzrfgnzc'
            // }]
            if (!vse && amplience) {
                const defaultHub = amplience?.default?.hub || null
                const envs = amplience?.envs || []
                if (envs.length) {
                    let env
                    if (defaultHub) {
                        env = envs.find((e) => e.hub === defaultHub)
                    }
                    if (!env) env = envs[0]
                    if (env) {
                        vse = env?.vse || null
                        timeMachine = env?.timeMachine || timeMachine
                    }
                }
            }

            if (!vse) {
                return params
            }

            // replace timestamp with placeholder token
            let regExp = /(.*-.*)-(.*)(\.staging.bigcontent.io)/ // kuifkfmrgfsv1qjsmei8dbbnq-gvzrfgnzc-1626217200000.staging.bigcontent.io
            let matches = vse.match(regExp)
            let vseMatch
            if (matches && matches.length > 0) {
                vseMatch = matches[1]
            } else {
                regExp = /(.*)(\.staging.bigcontent.io)/ // kuifkfmrgfsv1qjsmei8dbbnq.staging.bigcontent.io
                matches = vse.match(regExp)
                // append the time machine static var (e.g.: gvzrfgnzc)
                if (matches && matches.length > 0) {
                    vseMatch = `${matches[1]}-${timeMachine}`
                }
            }
            if (vseMatch) {
                params.push({
                    name: 'vse',
                    value: `${vseMatch}-{{effectiveDateTimeUnix}}.staging.bigcontent.io`
                })
                params.push({
                    name: 'vse-timestamp',
                    value: '{{effectiveDateTimeUnix}}'
                })
            }
            return params
        }
    }

    const updatePreviewContext = async () => {
        // optionally, call OCAPI custom hook to see if the change in shopper context (custom qualifiers/ session attributes)
        // triggered any customer groups
        // This class connects to a custom hook endpoint implemented by
        // https://github.com/SalesforceCommerceCloud/sfcc-hooks-collection
        // and can be used to retrieve customer groups for a given customer, based on the current auth access token
        // ** This is not automatically configured by this project. **

        const customerGroups = []

        try {
            const result = await api.shopperCustomerGroups.getCustomerGroups({})
            if (result && result?.c_result && result?.c_result.length) {
                result.c_result.map((customerGroup) => customerGroups.push(customerGroup.id))
            }
        } catch (e) {
            console.error('Error retrieving customer groups')
        }

        // set new customer groups to context
        if (customerGroups.length) {
            ampProps.groups = customerGroups
            api.auth._storage.set('customerGroups', JSON.stringify(customerGroups))
            document.cookie = `customerGroups=${JSON.stringify(customerGroups)};`
        }

        // in order for the personalized preview pricing and context to be updated
        // we need to trigger a re-render of the client side app
        // remove the context changed param from the url
        const params = new URLSearchParams(location.search)
        params.delete(PREVIEW_CONTEXT_CHANGED_QS_PARAM)

        // execute a soft navigation to the same page to trigger a re-render of client side context
        navigate(window.location.pathname + '?' + params.toString(), 'replace')
    }

    if (isStorefrontPreviewEnabled && onClient) {
        useEffect(async () => {
            const activeParams = new URLSearchParams(location.search || '')
            const contextChanged =
                activeParams &&
                activeParams.has(PREVIEW_CONTEXT_CHANGED_QS_PARAM) &&
                activeParams.get(PREVIEW_CONTEXT_CHANGED_QS_PARAM) === '1'
            if (!contextChanged) return
            await updatePreviewContext()
        }, [location])
    }

    return storefrontPreview
}
