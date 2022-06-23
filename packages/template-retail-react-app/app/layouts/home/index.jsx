/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {getLayout as getSiteLayoutHome} from '../site-layout-home'
import PropTypes from 'prop-types'

const HomeLayout = ({children}) => {
    return (
        <div>
            HomeLayout
            <div>{children}</div>
        </div>
    )
}

HomeLayout.propTypes = {
    children: PropTypes.node
}

export const getLayout = (page) => {
    return getSiteLayoutHome(<HomeLayout>{page}</HomeLayout>)
}

export default HomeLayout
