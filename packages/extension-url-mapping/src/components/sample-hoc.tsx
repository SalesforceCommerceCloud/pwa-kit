/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Define a type for the HOC props
type SampleHOCProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const sampleHOC = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const SampleHOC: React.FC<P> = (props: SampleHOCProps) => {
        return (
            <div className="sample-hoc">
                <WrappedComponent {...(props as P)} />
            </div>
        )
    }

    return SampleHOC
}

export default sampleHOC
