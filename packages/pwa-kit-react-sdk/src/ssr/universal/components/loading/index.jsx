/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'

const Loading = () => {
    const history = useHistory()
    const location = useLocation()

    // TODO: can we assume react-query is in use?
    const queryClient = useQueryClient()
    queryClient.invalidateQueries()

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const referrer = searchParams.get('referrer')

        setTimeout(() => history.replace(referrer), 1000)
    }, [])

    // TODO
    return <div>Loading...</div>
}

export default Loading
