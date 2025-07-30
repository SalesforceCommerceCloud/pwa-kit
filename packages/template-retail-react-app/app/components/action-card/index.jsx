/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {
    Stack,
    Box,
    Button,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {FormattedMessage} from 'react-intl'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'

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
    const styles = useMultiStyleConfig('ActionCard')

    const handleRemove = async () => {
        setShowLoading(true)
        try {
            return await Promise.resolve(onRemove())
        } finally {
            setShowLoading(false)
        }
    }

    return (
        <Box {...styles.container} {...props}>
            {showLoading && <LoadingSpinner />}
            <Stack spacing={3}>
                <Box {...styles.content}>{children}</Box>
                <Stack {...styles.actionsContainer}>
                    {onEdit && (
                        <Button
                            onClick={onEdit}
                            ref={editBtnRef}
                            aria-label={editBtnLabel}
                            {...styles.editButton}
                        >
                            <FormattedMessage defaultMessage="Edit" id="action_card.action.edit" />
                        </Button>
                    )}
                    {onRemove && (
                        <Button
                            onClick={handleRemove}
                            aria-label={removeBtnLabel}
                            {...styles.removeButton}
                        >
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
    children: PropTypes.node,

    /** Ref for the edit button so that it can be focused on for accessibility */
    editBtnRef: PropTypes.object,

    /** Accessibility label for edit button */
    editBtnLabel: PropTypes.string,

    /** Accessibility label for remove button */
    removeBtnLabel: PropTypes.string
}

export default ActionCard
