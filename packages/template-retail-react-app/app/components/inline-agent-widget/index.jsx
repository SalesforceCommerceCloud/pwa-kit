/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import useInlineAgentWidget from '@salesforce/retail-react-app/app/hooks/use-inline-agent-widget'

const InlineAgentWidget = ({config}) => {
    if (!config?.enabled) return null

    const containerRef = useInlineAgentWidget(config)

    return <div ref={containerRef} />
}

export default InlineAgentWidget
