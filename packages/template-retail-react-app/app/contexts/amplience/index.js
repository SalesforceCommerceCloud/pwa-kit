/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import * as cookie from 'cookie'
import {AmplienceAPI, defaultAmpClient} from '../../amplience-api'
import {default as amplience} from '../../../config/amplience/default.js'

/**
 * This is the global Amplience Realtime Visualisation Context on Non-category pages
 *
 * To use these context's simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {RealtimeVisualization} from './contexts/amplience'
 *
 * const RTV = useContext(RealtimeVisualization)
 *
 * export const RootCurrencyLabel = () => {
 *    const {currency} = useContext(CurrencyContext)
 *    return <div>{currency}</div>
 * }
 */
import {init} from 'dc-visualization-sdk'
import {signalPersonalisationChanged} from '../../amplience-api/utils'

export const RealtimeVisualization = React.createContext()

// Q: is there a way for a react context to run its own async function?
// thinking it would be nice NOT to init the viz SDK at the app level so we can
// import/init only where needed
export const RealtimeVisualizationProvider = ({status: initState, ampViz}) => {
    const [status, setStatus] = useState(initState)
    const [ampVizSdk, setAmpVizSdk] = useState(ampViz)

    ;async () => {
        const sdk = await init({debug: true})

        setAmpVizSdk(sdk)
        setStatus('connected')
    }

    return (
        <RealtimeVisualization.Provider
            value={[
                {status, setStatus},
                {ampVizSdk, setAmpVizSdk}
            ]}
        />
    )
}

RealtimeVisualizationProvider.propTypes = {
    status: PropTypes.string,
    ampViz: PropTypes.object
}

/**
 * This is the global Amplience Visualisation Context
 *
 * To use these context's simply import them into the component requiring context
 * like the below example:
 *
 * import React, {useContext} from 'react'
 * import {AmplienceContext} from './contexts/amplience'
 *
 * const vis = useContext(AmplienceContext)
 */

export const AmplienceContext = React.createContext()

export const AmplienceContextProvider = ({
    vse,
    hubname,
    contentId,
    vseTimestamp,
    groups: initialGroups,
    children
}) => {
    // Init client using VSE
    const [client] = useState(new AmplienceAPI())
    const [groups, setGroups] = useState(initialGroups)
    const [envs] = useState(amplience.envs)
    const [defaultEnv] = useState(amplience.default)

    useEffect(() => {
        if (groups !== initialGroups) {
            setGroups(initialGroups)
        }
    }, [initialGroups])

    // Switch the API to use the provided VSE, if present.
    client.setGroups(groups)
    client.setVse(vse)

    const updateGroups = (groups) => {
        defaultAmpClient.setGroups(groups)
        signalPersonalisationChanged()
        setGroups(groups)
    }

    return (
        <AmplienceContext.Provider
            value={{
                vse,
                hubname,
                contentId,
                vseTimestamp,
                envs,
                defaultEnv,
                groups,
                updateGroups,
                client
            }}
        >
            {children}
        </AmplienceContext.Provider>
    )
}

const getCookies = (headers) => {
    for (let i = 0; i < headers.length; i += 2) {
        if (headers[i] === 'Cookie') {
            return cookie.parse(headers[i + 1])
        }
    }

    return {}
}

export const getGroupsFromLocalStorage = ({req, res}) => {
    let groups = []

    if (res) {
        const cookies = getCookies(req.rawHeaders)
        groups = cookies['customerGroups']

        try {
            groups = JSON.parse(groups)
        } catch (e) {
            console.error(`No customer groups found in cookies`)
        }
    }

    return groups
}

export const generateVseProps = ({req, res, query}) => {
    // '/:locale/visualization'
    const vizRegEx = /\/(.*)\/visualization/
    if (req.originalUrl.match(vizRegEx)) {
        const url = req.originalUrl.split('?')[0]
        const [, locale] = url.match(vizRegEx)
        return {vse: query.vse, hubname: query.hub, contentId: query.contentId, locale}
    } else if (query['vse'] || query['vse-timestamp']) {
        let vse = null
        let vseTimestamp = 0

        if (res) {
            vse = query.vse
            vseTimestamp = query['vse-timestamp']
            vseTimestamp = vseTimestamp == 'null' ? 0 : Number(vseTimestamp)

            if (vse == null) {
                const cookies = getCookies(req.rawHeaders)
                vse = cookies['vse']
                vseTimestamp = cookies['vse-timestamp']
                vseTimestamp = vseTimestamp != null ? Number(vseTimestamp) : undefined
            }
        }
        return {vse, vseTimestamp}
    }
    return {vse: undefined, vseTimestamp: undefined}
}

AmplienceContextProvider.propTypes = {
    vse: PropTypes.string,
    vseTimestamp: PropTypes.number,
    groups: PropTypes.array,
    defaultEnv: PropTypes.any,
    envs: PropTypes.array,
    children: PropTypes.node.isRequired,
    hubname: PropTypes.string,
    contentId: PropTypes.string
}
