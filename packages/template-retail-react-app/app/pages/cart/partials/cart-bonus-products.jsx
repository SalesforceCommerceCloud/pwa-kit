/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {Heading} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import CartSelectBonusButton from '@salesforce/retail-react-app/app/pages/cart/partials/cart-select-bonus-button'

import {useBonusProductModalContext} from '@salesforce/retail-react-app/app/hooks/use-bonus-product-modal'
import {usePromotions} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'

const BonusProductsTitle = () => {
    const {data: basket} = useCurrentBasket()
    const bonusItemsCount =
        basket?.productItems?.filter((item) => item.bonusProductLineItem).length || 0

    return (
        <Heading as="h2" fontSize="xl">
            <FormattedMessage
                defaultMessage="Bonus Products ({itemCount, plural, =0 {0 items} one {# item} other {# items}})"
                values={{itemCount: bonusItemsCount}}
                id="bonus_products_title.title.num_of_items"
            />
        </Heading>
    )
}

const BonusProductsSelection = ({basket}) => {
    // Open bonus product modal when bonus button is clicked
    const {onOpen: onBonusProductModalOpen} = useBonusProductModalContext()
    const handleBonusButtonClick = (bonusOffers) => {
        onBonusProductModalOpen({
            newBonusItems: bonusOffers
        })
    }
    // Memoize bonus logic so it only recalculates when basket changes
    const {bonusProductsOffersMap, bonusDiscountToQuantityMap} = React.useMemo(() => {
        // Map of bonus discount line items to bonus line items
        const bonusProductsOffersMap = {}
        if (basket?.bonusDiscountLineItems?.length > 0) {
            basket.bonusDiscountLineItems.forEach((bonusLine) => {
                if (!bonusLine?.bonusProducts?.length) return
                bonusProductsOffersMap[bonusLine.id] = bonusLine
            })
        }

        // Map of bonus discount line items to quantity in cart
        const bonusDiscountToQuantityMap = {}
        basket?.productItems?.forEach((productItem) => {
            if (!productItem?.bonusDiscountLineItemId) return
            const bonusDiscountId = productItem.bonusDiscountLineItemId
            if (!bonusDiscountToQuantityMap[bonusDiscountId]) {
                bonusDiscountToQuantityMap[bonusDiscountId] = 0
            }
            bonusDiscountToQuantityMap[bonusDiscountId] += productItem.quantity
        })

        // Remove bonus line items that have reached max bonus items
        Object.entries(bonusProductsOffersMap).forEach(([bonusDiscountId, bonusLine]) => {
            const quantityInCart = bonusDiscountToQuantityMap[bonusDiscountId] || 0
            if (bonusLine.maxBonusItems <= quantityInCart) {
                delete bonusProductsOffersMap[bonusDiscountId]
            }
        })
        return {bonusProductsOffersMap, bonusDiscountToQuantityMap}
    }, [basket])

    // Call promotions API to get promotion info to display promotion name
    let promotionIds = []
    if (Object.keys(bonusProductsOffersMap).length > 0) {
        promotionIds = Object.values(bonusProductsOffersMap).map(
            (bonusLine) => bonusLine.promotionId
        )
    }

    const {data: promotions} = usePromotions(
        {
            parameters: {
                ids: promotionIds.join(',')
            }
        },
        {
            enabled: promotionIds.length > 0
        }
    )

    const promotionInfoMap = Object.fromEntries(
        (promotions?.data || []).map((promo) => [promo.id, promo])
    )

    // Render list of Select Bonus Buttons if there are bonus offers
    const hasBonusOffers = Object.keys(bonusProductsOffersMap).length > 0

    if (!hasBonusOffers) return null

    return (
        <Box
            position="relative"
            width="100%"
            borderWidth="1px"
            borderRadius="base"
            backgroundColor="white"
            marginBottom={2}
            boxShadow="base"
        >
            {Object.entries(bonusProductsOffersMap).map(([bonusDiscountId, offers]) => (
                <CartSelectBonusButton
                    key={bonusDiscountId}
                    promotionName={promotionInfoMap[offers.promotionId]?.details}
                    maxOfferCount={offers.maxBonusItems}
                    selectedOfferCount={bonusDiscountToQuantityMap[bonusDiscountId] || 0}
                    handleBonusButtonClick={() => handleBonusButtonClick([offers])}
                />
            ))}
        </Box>
    )
}

BonusProductsSelection.propTypes = {
    basket: PropTypes.shape({
        bonusDiscountLineItems: PropTypes.array,
        productItems: PropTypes.array
    })
}

export {BonusProductsTitle, BonusProductsSelection}
