/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'
import useInlineAgentWidget from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const InlineAgentWidget = ({config}) => {
    const containerRef = useInlineAgentWidget(config)

    if (!config?.enabled) return null

    return (
        <>
            <Helmet>
                <script src="/static/inline-agent-widget.umd.js" async></script>
            </Helmet>
            <div ref={containerRef} />
        </>
    )
}

InlineAgentWidget.propTypes = {
    config: PropTypes.shape({
        enabled: PropTypes.bool,
        scrt2Url: PropTypes.string,
        orgId: PropTypes.string,
        esDeveloperName: PropTypes.string,
        capabilitiesVersion: PropTypes.string,
        placeholder: PropTypes.string
    })
}

export default InlineAgentWidget
