/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Stack, Box, Button} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'
import LoadingSpinner from '../loading-spinner'

/**
 * Renders a card-style box with optional edit and remove buttons. Used for
 * lists of addresses, payment methods, or any other list-type content.
 * The provided `onRemove` callback triggers a loading spinner internally
 * if given a promise.
 */
const ActionCard = ({children, onEdit, onRemove, ...props}) => {
    const [showLoading, setShowLoading] = useState(false)

    const handleRemove = async () => {
        setShowLoading(!showLoading)
        try {
            return await Promise.resolve(onRemove())
        } catch (err) {
            setShowLoading(!showLoading)
            throw err
        }
    }

    return (
        <Box
            spacing={4}
            p={4}
            position="relative"
            border="1px solid"
            borderColor="gray.100"
            borderRadius="base"
            {...props}
        >
            {showLoading && <LoadingSpinner />}
            <Stack spacing={3}>
                <Box>{children}</Box>
                <Stack direction="row" spacing={4}>
                    {onEdit && (
                        <Button onClick={onEdit} variant="link" size="sm">
                            <FormattedMessage defaultMessage="Edit" id="action_card.action.edit" />
                        </Button>
                    )}
                    {onRemove && (
                        <Button variant="link" size="sm" colorScheme="red" onClick={handleRemove}>
                            <FormattedMessage
                                defaultMessage="Remove"
                                id="action_card.action.remove"
                            />
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    )
}

ActionCard.propTypes = {
    /** Callback fired on edit */
    onEdit: PropTypes.func,

    /** Callback fired on remove click (if promise, will toggle loading spinner) */
    onRemove: PropTypes.func,

    /** Content rendered in card */
    children: PropTypes.node
}

export default ActionCard
