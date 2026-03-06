/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Helmet} from 'react-helmet'
import type {Component as ComponentType, PageWithDesignMetadata} from '../types'
import {Region} from '../Region'

type ComponentMap = {
    [typeId: string]: React.ComponentType<ComponentType & unknown>
}

interface PageProps extends React.ComponentProps<'div'> {
    page: PageWithDesignMetadata
    components?: ComponentMap
}

type PageContextValue = {
    components: ComponentMap
}

// This context will hold the component map as well as any other future context.
export const PageContext = React.createContext<PageContextValue | undefined>(undefined)

/**
 * This component will render a page designer page given its serialized data object.
 * It wraps the page with PageDesignerProvider to enable design mode capabilities.
 *
 * @param {PageProps} props
 * @param {Page} props.page - The page designer page data representation.
 * @param {ComponentMap} props.components - A mapping of typeId's to react components representing the type.
 * @param {Object} props.pageDesigner - Optional Page Designer configuration for design mode.
 * @returns {React.ReactElement} - Page component.
 */
export const Page = (props: PageProps) => {
    const {page, className = '', ...rest} = props
    const {id, regions, pageDescription, pageKeywords, pageTitle} = page || {}

    return (
        <div>
            <Helmet>
                {pageTitle && <title>{pageTitle}</title>}
                {pageDescription && <meta name="description" content={pageDescription} />}
                {pageKeywords && <meta name="keywords" content={pageKeywords} />}
            </Helmet>
            <div id={id} className={`page ${className}`} {...rest}>
                <div className="container">
                    {regions?.map((region) => (
                        <Region key={region.id} page={page} regionId={region.id} />
                    ))}
                </div>
            </div>
        </div>
    )
}

Page.displayName = 'Page'

export default Page
