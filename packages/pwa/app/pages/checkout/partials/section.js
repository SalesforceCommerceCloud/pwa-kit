import React, {useContext, createContext} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Flex, Heading, Stack} from '@chakra-ui/react'
import LoadingScrim from './loading-scrim'

const SectionContext = createContext()

export const Section = ({id, title, editing, disabled, onEdit, editLabel, isLoading, children}) => {
    return (
        <SectionContext.Provider value={{editing, disabled}}>
            <Box
                layerStyle="card"
                rounded={[0, 0, 'base']}
                px={[4, 4, 6]}
                data-testid={`sf-checkout-section-${id}`}
                position="relative"
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
                        {!editing && !disabled && (
                            <Button variant="link" size="sm" onClick={onEdit}>
                                {editLabel || <FormattedMessage defaultMessage="Edit" />}
                            </Button>
                        )}
                    </Flex>
                    <Box data-testid={`sf-checkout-section-${id}-content`}>{children}</Box>
                </Stack>

                {isLoading && editing && <LoadingScrim />}
            </Box>
        </SectionContext.Provider>
    )
}

export const SectionEdit = ({children}) => {
    const {editing} = useContext(SectionContext)
    return editing ? children : null
}

export const SectionSummary = ({children}) => {
    const {editing, disabled} = useContext(SectionContext)
    return !editing && !disabled ? children : null
}

Section.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    editLabel: PropTypes.any,
    editing: PropTypes.bool,
    isLoading: PropTypes.bool,
    disabled: PropTypes.bool,
    onEdit: PropTypes.func,
    children: PropTypes.any
}

SectionEdit.propTypes = {
    children: PropTypes.any
}

SectionSummary.propTypes = {
    children: PropTypes.any
}
