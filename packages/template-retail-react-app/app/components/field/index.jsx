/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Controller} from 'react-hook-form'
import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    IconButton,
    Input,
    InputGroup,
    InputRightElement,
    Select,
    Checkbox
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    VisibilityIcon,
    VisibilityOffIcon,
    AlertIcon
} from '@salesforce/retail-react-app/app/components/icons'
import {useIntl} from 'react-intl'

const Field = ({
    name,
    label,
    formLabel,
    type = 'text',
    options = [],
    rules = {},
    error,
    placeholder,
    inputProps,
    control,
    autoComplete,
    defaultValue,
    helpText,
    children
}) => {
    const intl = useIntl()
    const [hidePassword, setHidePassword] = useState(true)
    const PasswordIcon = hidePassword ? VisibilityIcon : VisibilityOffIcon
    const passwordIconLabel = hidePassword
        ? intl.formatMessage({
              id: 'field.password.assistive_msg.show_password',
              defaultMessage: 'Show password'
          })
        : intl.formatMessage({
              id: 'field.password.assistive_msg.hide_password',
              defaultMessage: 'Hide password'
          })
    const inputType =
        type === 'password' && hidePassword ? 'password' : type === 'password' ? 'text' : type
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            defaultValue={defaultValue}
            render={({field: {onChange, value, ref}}) => {
                const _inputProps =
                    typeof inputProps === 'function' ? inputProps({value, onChange}) : inputProps

                return (
                    <FormControl id={name} isInvalid={error}>
                        {!['checkbox', 'radio', 'hidden'].includes(type) &&
                            (formLabel || <FormLabel>{label}</FormLabel>)}

                        <InputGroup>
                            {['text', 'password', 'email', 'phone', 'tel', 'number'].includes(
                                type
                            ) && (
                                <Input
                                    ref={ref}
                                    onChange={onChange}
                                    value={value}
                                    type={inputType}
                                    placeholder={placeholder}
                                    autoComplete={autoComplete}
                                    {..._inputProps}
                                />
                            )}

                            {type === 'hidden' && (
                                <input
                                    ref={ref}
                                    onChange={onChange}
                                    value={value}
                                    type="hidden"
                                    {..._inputProps}
                                />
                            )}

                            {type === 'password' && (
                                <InputRightElement>
                                    <IconButton
                                        variant="ghosted"
                                        aria-label={passwordIconLabel}
                                        icon={<PasswordIcon color="gray.500" boxSize={6} />}
                                        onClick={() => setHidePassword(!hidePassword)}
                                    />
                                </InputRightElement>
                            )}

                            {type === 'select' && (
                                <Select
                                    ref={ref}
                                    onChange={onChange}
                                    value={value}
                                    placeholder={placeholder}
                                    {..._inputProps}
                                >
                                    {options.map((opt) => (
                                        <option key={`${opt.label}-${opt.value}`} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </Select>
                            )}

                            {type === 'checkbox' && (
                                <Checkbox
                                    ref={ref}
                                    onChange={(e) => onChange(e.target.checked)}
                                    isChecked={value}
                                    {..._inputProps}
                                >
                                    {formLabel || label}
                                </Checkbox>
                            )}

                            {children}
                        </InputGroup>

                        {error && type !== 'hidden' && (
                            <FormErrorMessage color="red.600">
                                <AlertIcon aria-hidden="true" mr={2} />
                                {error.message}
                            </FormErrorMessage>
                        )}

                        {helpText}
                    </FormControl>
                )
            }}
        />
    )
}

Field.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    autoComplete: PropTypes.string,
    formLabel: PropTypes.any,
    type: PropTypes.oneOf([
        'text',
        'number',
        'password',
        'email',
        'phone',
        'tel',
        'select',
        'checkbox',
        'hidden'
    ]),
    options: PropTypes.arrayOf(PropTypes.shape({label: PropTypes.string, value: PropTypes.any})),
    rules: PropTypes.object,
    error: PropTypes.shape({message: PropTypes.string}),
    placeholder: PropTypes.string,
    inputProps: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    control: PropTypes.object,
    defaultValue: PropTypes.any,
    helpText: PropTypes.any,
    children: PropTypes.any
}

export default Field
