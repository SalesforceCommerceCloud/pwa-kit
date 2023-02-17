/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {componentMapProxy} from './utils'
import {Page} from '../../components/experience/page'
import {pageType} from '../../components/experience/types'

const PageViewer = ({page}) => {
    return <Page page={page} components={componentMapProxy} />
}

PageViewer.getProps = async ({api}) => {
    const page = await api.shopperExperience.getPage({
        parameters: {
            pageId: 'homepage-example'
        }
    })
    console.log('Page: ', page)
    return {
        page
    }
}

PageViewer.displayName = 'PageViewer'

PageViewer.propTypes = {
    page: pageType.isRequired
}

export default PageViewer
