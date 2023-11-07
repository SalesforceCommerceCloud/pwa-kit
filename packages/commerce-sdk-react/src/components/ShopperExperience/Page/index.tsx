/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useEffect, useState} from 'react'
import {Helmet} from 'react-helmet'
import type {Component as ComponentType, Page as PageType} from '../types'
import {Region} from '../Region'

type ComponentMap = {
    [typeId: string]: React.ComponentType<ComponentType & unknown>
}

type JsxParserComponents = Record<string, ComponentType>

interface PageProps extends React.ComponentProps<'div'> {
    page: PageType
    components: ComponentMap
    jsxParserComponents?: JsxParserComponents
}

type PageContextValue = {
    components: ComponentMap
    jsxParserComponents?: JsxParserComponents
}

// This context will hold the component map as well as any other future context.
export const PageContext = React.createContext<PageContextValue | undefined>(undefined)

// This hook allows sub-components to use the page context. In our case we use it
// so that the generic <Component /> can use the component map to know which react component
// to render.
export const usePageContext = () => {
    const value = useContext(PageContext)

    if (!value) {
        throw new Error('"usePageContext" cannot be used outside of a page component.')
    }

    return value
}

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param {PageProps} props
 * @param {Page} props.region - The page designer page data representation.
 * @param {ComponentMap} props.components - A mapping of typeId's to react components representing the type.
 * @param {JsxParserComponents} [props.jsxParserComponents] - An array of react components that the jsx parser can use, optional.
 * @returns {React.ReactElement} - Page component.
 */
export const Page = (props: PageProps) => {
    const {page, components, jsxParserComponents, className = '', ...rest} = props
    const [contextValue, setContextValue] = useState({
        components,
        jsxParserComponents
    } as PageContextValue)
    const {id, regions, pageDescription, pageKeywords, pageTitle} = page || {}

    // NOTE: This probably is not required as the list of components is known at compile time,
    // but we might need this ability in the future if we are to lazy load components.
    useEffect(() => {
        setContextValue({
            ...contextValue,
            components
        })
    }, [components])

    useEffect(() => {
        if (!jsxParserComponents) {
            return
        }
        setContextValue({
            ...contextValue,
            jsxParserComponents
        })
    }, [jsxParserComponents])

    return (
        <PageContext.Provider value={contextValue}>
            <Helmet>
                {pageTitle && <title>{pageTitle}</title>}
                {pageDescription && <meta name="description" content={pageDescription} />}
                {pageKeywords && <meta name="keywords" content={pageKeywords} />}
            </Helmet>
            <div id={id} className={`page ${className}`} {...rest}>
                <div className="container">
                    {regions?.map((region) => (
                        <Region key={region.id} region={region} />
                    ))}
                </div>
            </div>
        </PageContext.Provider>
    )
}

Page.displayName = '[Page Designer] Page'

export default Page
