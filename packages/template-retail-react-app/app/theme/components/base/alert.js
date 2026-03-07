/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Helper function to get the appropriate colorScheme based on status
function getColorScheme(props) {
    const statusColorMap = {
        error: 'red',
        success: 'green',
        warning: 'orange',
        info: 'blue'
    }
    return props.colorScheme || statusColorMap[props.status] || 'green'
}

export default {
    baseStyle: (props) => {
        const colorScheme = getColorScheme(props)

        return {
            container: {
                borderRadius: 'base'
            },
            icon: {
                color: `${colorScheme}.500`,
                boxSize: 4
            },
            description: {
                fontSize: 'sm',
                ml: 3,
                color: `${colorScheme}.700`
            }
        }
    },
    variants: {
        subtle: (props) => {
            const colorScheme = getColorScheme(props)

            return {
                container: {
                    borderColor: `${colorScheme}.600`,
                    borderWidth: 1,
                    borderStyle: 'solid'
                }
            }
        }
    }
}
