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
} from '@chakra-ui/react'
import {VisibilityIcon, VisibilityOffIcon} from '../icons'

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
    defaultValue,
    helpText,
    children
}) => {
    const [hidePassword, setHidePassword] = useState(true)
    const PasswordIcon = hidePassword ? VisibilityIcon : VisibilityOffIcon
    const inputType =
        type === 'password' && hidePassword ? 'password' : type === 'password' ? 'text' : type

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            defaultValue={defaultValue}
            render={({onChange, value, ref}) => {
                const _inputProps =
                    typeof inputProps === 'function' ? inputProps({value, onChange}) : inputProps

                return (
                    <FormControl id={name} isInvalid={error}>
                        {!['checkbox', 'radio'].includes(type) &&
                            type !== 'hidden' &&
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
                                        aria-label="Show password"
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

                        {error && !type !== 'hidden' && (
                            <FormErrorMessage>{error.message}</FormErrorMessage>
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
