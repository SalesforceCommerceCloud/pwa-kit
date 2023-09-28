/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {createRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Heading, useBreakpointValue} from '@chakra-ui/react'
import {fromContentItem, createWidget} from '@amplience/dc-integration-stylitics'

const Stylitics = ({header, ...props}) => {
    const isMobile = useBreakpointValue({base: true, lg: false, xl: false, xxl: false, xxxl: false})

    const container = createRef()
    useEffect(() => {
        if (!window || !container.current) {
            return
        }

        let target = container.current

        let widgetInstance
        let active = true

        const args = fromContentItem(props)

        createWidget(target, args).then((widget) => {
            if (active) {
                widgetInstance = widget

                widget.start()
            } else {
                widget.destroy()
            }
        })

        return () => {
            active = false

            if (widgetInstance) {
                widgetInstance.destroy()
            }

            if (target) {
                target.innerHTML = ''
            }
        }
    }, [container, props, isMobile])

    return (
        <div>
            {header && <Heading as="h2">{header}</Heading>}
            <div ref={container} className="stylitics"></div>
        </div>
    )
}

Stylitics.displayName = 'Stylitics'

Stylitics.propTypes = {
    header: PropTypes.string,
    view: PropTypes.string,
    api: PropTypes.object,
    display: PropTypes.object,
    price: PropTypes.object,
    classic: PropTypes.object,
    hotspots: PropTypes.object,
    moodboard: PropTypes.object,
    gallery: PropTypes.object,
    mainAndDetail: PropTypes.object,
    account: PropTypes.string,
    sku: PropTypes.string
}

export default Stylitics
