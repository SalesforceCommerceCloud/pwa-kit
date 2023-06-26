/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Text, Button, Stack, Box} from '@salesforce/retail-react-app/app/components/shared/ui'

const Suggestions = ({suggestions, closeAndNavigate}) => {
    if (!suggestions) {
        return null
    }
    return (
        <Stack spacing={0} data-testid="sf-suggestion">
            <Box mx={'-16px'}>
                {suggestions.map((suggestion, idx) => (
                    <Button
                        width="full"
                        onMouseDown={() => closeAndNavigate(suggestion.link)}
                        fontSize={'md'}
                        key={idx}
                        marginTop={0}
                        variant="menu-link"
                    >
                        <Text
                            fontWeight="400"
                            dangerouslySetInnerHTML={{__html: suggestion.name}}
                        />
                    </Button>
                ))}
            </Box>
        </Stack>
    )
}

Suggestions.propTypes = {
    suggestions: PropTypes.array,
    closeAndNavigate: PropTypes.func
}

export default Suggestions
