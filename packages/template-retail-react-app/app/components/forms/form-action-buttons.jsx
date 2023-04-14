/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Button, Stack} from '@chakra-ui/react'
import {MESSAGE_PROPTYPE} from '../../utils/locale.js'

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
                {saveButtonLabel ? (
                    <FormattedMessage {...saveButtonLabel} />
                ) : (
                    <FormattedMessage defaultMessage="Save" id="form_action_buttons.button.save" />
                )}
            </Button>
            <Button variant="outline" minWidth={28} onClick={onCancel} {...cancelButtonProps}>
                {cancelButtonLabel ? (
                    <FormattedMessage {...cancelButtonLabel} />
                ) : (
                    <FormattedMessage
                        id="form_action_buttons.button.cancel"
                        defaultMessage="Cancel"
                    />
                )}
            </Button>
        </Stack>
    )
}

FormActionButtons.propTypes = {
    saveButtonProps: PropTypes.object,
    cancelButtonProps: PropTypes.object,
    saveButtonLabel: MESSAGE_PROPTYPE,
    cancelButtonLabel: MESSAGE_PROPTYPE,
    onCancel: PropTypes.func
}

export default FormActionButtons
