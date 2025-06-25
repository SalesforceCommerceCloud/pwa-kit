/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Helmet from 'react-helmet'
import {UserConfig} from '../../types/config'

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

interface SeoProps {
    title?: string
    description?: string
    noIndex?: boolean
    keywords?: string
    children?: React.ReactNode
}

const Seo: React.FC<SeoProps> = ({title, description, noIndex, keywords, children, ...props}) => {
    const {defaultSiteTitle} = getConfig() as UserConfig
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

export default Seo
