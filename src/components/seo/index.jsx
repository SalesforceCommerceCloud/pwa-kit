/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

import {useExtensionConfig} from '../../hooks'

const Seo = ({title, description, noIndex, keywords, children, ...props}) => {
    const {defaultSiteTitle} = useExtensionConfig()
    const fullTitle = title ? `${title} | ${defaultSiteTitle}` : defaultSiteTitle

    return (
        <Helmet {...props}>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {noIndex && <meta name="robots" content="noindex" />}
            {keywords && <meta name="keywords" content={keywords} />}
            {children}
        </Helmet>
    )
}

Seo.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    noIndex: PropTypes.bool,
    children: PropTypes.node,
    keywords: PropTypes.string
}

export default Seo
