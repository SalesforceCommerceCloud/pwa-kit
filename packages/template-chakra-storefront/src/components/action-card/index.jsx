/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Stack, Box, Button} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import LoadingSpinner from '../../components/loading-spinner'

/**
 * Renders a card-style box with optional edit and remove buttons. Used for
 * lists of addresses, payment methods, or any other list-type content.
 * The provided `onRemove` callback triggers a loading spinner internally
 * if given a promise.
 */
const ActionCard = ({
    children,
    onEdit,
    onRemove,
    editBtnRef,
    editBtnLabel,
    removeBtnLabel,
    ...props
}) => {
    const [showLoading, setShowLoading] = useState(false)
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            edit: formatMessage({
                id: 'action_card.action.edit',
                defaultMessage: 'Edit'
            }),
            remove: formatMessage({
                id: 'action_card.action.remove',
                defaultMessage: 'Remove'
            })
        }),
        [intl]
    )

    const handleRemove = async () => {
        setShowLoading(true)
        try {
            return await Promise.resolve(onRemove())
        } finally {
            setShowLoading(false)
        }
    }

    return (
        <Box
            p="4"
            position="relative"
            border="1px solid"
            borderColor="gray.100"
            rounded="md"
            {...props}
        >
            {showLoading && <LoadingSpinner />}
            <Stack gap="3">
                <Box>{children}</Box>
                <Stack direction="row" gap="4">
                    {onEdit && (
                        <Button
                            onClick={onEdit}
                            variant="link-blue"
                            size="sm"
                            ref={editBtnRef}
                            aria-label={editBtnLabel}
                        >
                            {messages.edit}
                        </Button>
                    )}
                    {onRemove && (
                        <Button
                            variant="link-red"
                            size="sm"
                            onClick={handleRemove}
                            aria-label={removeBtnLabel}
                        >
                            {messages.remove}
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
    children: PropTypes.node,

    /** Ref for the edit button so that it can be focused on for accessibility */
    editBtnRef: PropTypes.object,

    /** Accessibility label for edit button */
    editBtnLabel: PropTypes.string,

    /** Accessibility label for remove button */
    removeBtnLabel: PropTypes.string
}

export default ActionCard
