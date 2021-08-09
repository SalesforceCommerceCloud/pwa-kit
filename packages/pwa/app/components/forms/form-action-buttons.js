import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Stack} from '@chakra-ui/react'

/**
 * Renders a form submit button and a cancel button with configurable labels and callbacks
 * in a responsive layout. Used primarily in forms that can be toggled opened/closed.
 */
const FormActionButtons = ({
    saveButtonProps = {},
    cancelButtonProps = {},
    saveButtonLabel,
    cancelButtonLabel,
    onCancel = () => {}
}) => {
    return (
        <Stack direction={{base: 'column', lg: 'row-reverse'}} spacing={4}>
            <Button type="submit" minWidth={28} {...saveButtonProps}>
                {saveButtonLabel || <FormattedMessage defaultMessage="Save" />}
            </Button>
            <Button variant="outline" minWidth={28} onClick={onCancel} {...cancelButtonProps}>
                {cancelButtonLabel || <FormattedMessage defaultMessage="Cancel" />}
            </Button>
        </Stack>
    )
}

FormActionButtons.propTypes = {
    saveButtonProps: PropTypes.object,
    cancelButtonProps: PropTypes.object,
    saveButtonLabel: PropTypes.string,
    cancelButtonLabel: PropTypes.string,
    onCancel: PropTypes.func
}

export default FormActionButtons
