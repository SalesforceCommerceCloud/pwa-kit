/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl} from 'react-intl'

const SelectBonusProductsButton = ({
    bonusDiscountLineItems,
    product,
    itemsAdded,
    onOpenBonusModal,
    onClose,
    ...buttonProps
}) => {
    const intl = useIntl()

    const handleClick = () => {
        if (onOpenBonusModal) {
            onOpenBonusModal({
                bonusDiscountLineItems,
                product,
                itemsAdded
            })
        }
        if (onClose) onClose()
    }

    return (
        <Button
            onClick={handleClick}
            width="100%"
            variant="outline"
            colorScheme="blue"
            size="md"
            height={9}
            minWidth={11}
            fontSize="sm"
            {...buttonProps}
        >
            {intl.formatMessage({
                defaultMessage: 'Select Bonus Products',
                id: 'add_to_cart_modal.button.select_bonus_products'
            })}
        </Button>
    )
}

SelectBonusProductsButton.propTypes = {
    bonusDiscountLineItems: PropTypes.array,
    product: PropTypes.object,
    itemsAdded: PropTypes.array,
    onOpenBonusModal: PropTypes.func,
    onClose: PropTypes.func
}

export default SelectBonusProductsButton
