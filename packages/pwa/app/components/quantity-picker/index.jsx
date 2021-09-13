/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

import {Button, HStack, Input, useNumberInput} from '@chakra-ui/react'

/**
 * This is the mobile implementation of the Chakra NumberInput. This simple component essentially
 * is a helper so we don't have to reuse the hooks every time we need a number input since design dictates
 * we use the moobile variation on all screens.
 *
 * NOTE: We can optionally put global logic we see if in here, and various styling decisions in this single
 * component.
 *
 * @param {*} props
 * @returns
 */
const QuantityPicker = (props) => {
    const {getInputProps, getIncrementButtonProps, getDecrementButtonProps} = useNumberInput({
        ...props,
        focusInputOnChange: false
    })

    const inc = getIncrementButtonProps({variant: 'outline'})
    const dec = getDecrementButtonProps({variant: 'outline'})
    const input = getInputProps({maxWidth: '44px'})

    return (
        <HStack>
            <Button {...dec}>-</Button>
            <Input {...input} />
            <Button {...inc}>+</Button>
        </HStack>
    )
}

export default QuantityPicker
