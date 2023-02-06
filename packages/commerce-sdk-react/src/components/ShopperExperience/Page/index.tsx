/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, useEffect, useState} from 'react'
import {PageDef} from '../types'
import {Region} from '../Region'

type ComponentMap = {
    [key: string]: React.ComponentType
}
type PageProps = {
    page: PageDef
    components: ComponentMap
}
type PageContextValue = {
    components: ComponentMap
}

// This context will hold the component map as well as any other future context.
export const PageContext = React.createContext({components: {}} as PageContextValue)

// This hook allows sub-components to use the page context. In our case we use it
// so that the generic <Component /> can use the component map to know which react component
// to render.
export const usePageContext = () => {
    const value = useContext(PageContext)
    return value
}

/**
 * This component will render a page designer page given its serialized data object.
 *
 * @param Page
 * @returns JSX.Element
 */
export const Page = ({page, components}: PageProps) => {
    const [contextValue, setContextValue] = useState({components} as PageContextValue)
    const {id, regions} = page || {}

    // NOTE: Probably not required as the list of components is known at compile time, 
    // but we might need this ability if we are to lazy load components.
    useEffect(() => {
        setContextValue({
            ...contextValue,
            components
        })
    }, [components])

    return (
        <PageContext.Provider value={contextValue}>
            <div className="storepage" id={id}>
                <div className="container">
                    <div className="row">
                        {regions?.map((region) => (
                            <Region key={region.id} region={region} />
                        ))}
                    </div>
                </div>
            </div>
        </PageContext.Provider>
    )
}

Page.displayName = 'Page'

export default Page
