/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {Region} from '../region'
import {pageType} from '../types'

// This context will hold the component map as well as any other future context.
export const PageContext = React.createContext(undefined)

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
 * @returns {React.ReactElement} - Page component.
 */
export const Page = (props) => {
    const {page, components, className = '', ...rest} = props
    const [contextValue, setContextValue] = useState({components})
    const {id, regions, pageDescription, pageKeywords, pageTitle} = page || {}

    // NOTE: This probably is not required as the list of components is known at compile time,
    // but we might need this ability in the future if we are to lazy load components.
    useEffect(() => {
        setContextValue({
            ...contextValue,
            components
        })
    }, [components])

    // A major pain point for the current development of Storefront Preview is that we don't have
    // static URLs on deployed sites. The path /mobify/bundle/123/static/storefront-preview.js
    // changes to a different number with every deployment. Once we figure out the static URL we can
    // update it for production, but will still need to come up with something for staging...

    const storefrontPreviewClientScript =
        process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/mobify/bundle/development/static/storefront-preview.js'
            : // Gotta update this manually for now... :(
              // : 'https://runtime.commercecloud.com/storefront-preview.js'
              null

    if (!storefrontPreviewClientScript) {
        // Deliberately aggressive because this branch exists solely for Storefront Preview development
        throw new Error('Hey! You forgot to set a Storefront Preview client script URL!')
    }

    return (
        <PageContext.Provider value={contextValue}>
            <Helmet>
                {pageTitle && <title>{pageTitle}</title>}
                {pageDescription && <meta name="description" content={pageDescription} />}
                {pageKeywords && <meta name="keywords" content={pageKeywords} />}
                <script src={storefrontPreviewClientScript} type="text/javascript"></script>
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

Page.displayName = 'Page'

Page.propTypes = {
    page: pageType.isRequired,
    components: PropTypes.object.isRequired,
    className: PropTypes.string
}

export default Page
