/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useContext, createContext} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Flex,
    Heading,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'

const ToggleCardContext = createContext()

/**
 * A card-like box that renders one of two states: 'edit' and 'summary'. It takes a single
 * `ToggleCardSummary` and `ToggleCardEdit` component as children and renders one or the
 * other depending on the `editing` prop. See `app/pages/checkout` for example.
 */
export const ToggleCard = ({
    id,
    title,
    editing,
    disabled,
    onEdit,
    editLabel,
    isLoading,
    children,
    ...props
}) => {
    return (
        <ToggleCardContext.Provider value={{editing, disabled}}>
            <Box
                layerStyle="card"
                rounded={[0, 0, 'base']}
                px={[4, 4, 6]}
                data-testid={`sf-toggle-card-${id}`}
                position="relative"
                {...props}
            >
                <Stack spacing={editing || (!editing && !disabled) ? 4 : 0}>
                    <Flex justify="space-between">
                        <Heading
                            fontSize="lg"
                            lineHeight="30px"
                            color={disabled && !editing && 'gray.400'}
                        >
                            {title}
                        </Heading>
                        {!editing && !disabled && onEdit && (
                            <Button variant="link" size="sm" onClick={onEdit}>
                                {editLabel || (
                                    <FormattedMessage
                                        defaultMessage="Edit"
                                        id="toggle_card.action.edit"
                                    />
                                )}
                            </Button>
                        )}
                    </Flex>
                    <Box data-testid={`sf-toggle-card-${id}-content`}>{children}</Box>
                </Stack>

                {isLoading && editing && <LoadingSpinner />}
            </Box>
        </ToggleCardContext.Provider>
    )
}

export const ToggleCardEdit = ({children}) => {
    const {editing} = useContext(ToggleCardContext)
    return editing ? children : null
}

export const ToggleCardSummary = ({children}) => {
    const {editing, disabled} = useContext(ToggleCardContext)
    return !editing && !disabled ? children : null
}

ToggleCard.propTypes = {
    id: PropTypes.string,
    title: PropTypes.any,
    editLabel: PropTypes.any,
    editing: PropTypes.bool,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool,
    onEdit: PropTypes.func,
    children: PropTypes.any
}

ToggleCardEdit.propTypes = {
    children: PropTypes.any
}

ToggleCardSummary.propTypes = {
    children: PropTypes.any
}
