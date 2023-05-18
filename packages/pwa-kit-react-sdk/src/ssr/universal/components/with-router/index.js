/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useLocation, useNavigate, useParams} from 'react-router-dom'

export const withRouter = (Component) => {
    const WithRouter = (props) => {
        const params = useParams()
        const navigate = useNavigate()
        const location = useLocation()

        return <Component {...props} router={{location, navigate, params}} />
    }

    return WithRouter
}
