/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useCallback, useMemo, useState} from 'react'
import {Box, Container, Heading, Text, Code, VStack} from '@chakra-ui/react'
import {useLocation} from 'react-router-dom'

import SFPaymentsExpressAgent from '@salesforce/retail-react-app/app/components/sf-payments-express-agent'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
// iframe way — reused hooks so the iframe path performs the same temp-basket
// setup as the slot path. Mapper is inlined below (copied from the slot
// adapter) instead of imported, so the iframe mechanism can be enabled/disabled
// entirely from this file without pulling the slot adapter's module graph
// (which imports HTMLElement and would crash SSR).
import {useShopperBasketsV2Mutation as useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCleanupTemporaryBaskets} from '@salesforce/retail-react-app/app/hooks/use-cleanup-temporary-baskets'

// iframe way — inlined copy of scapiOrderToOrderDetails from tile-extension-adapter.jsx.
// Kept identical to that version so both mechanisms hand Cimulate the same shape.
const scapiOrderToOrderDetails = (order) => {
    const currencyCode = order?.currency ?? 'USD'
    const items = (order?.productItems ?? []).map((item) => ({
        itemId: item.itemId ?? item.productId,
        productId: item.productId,
        name: item.productName ?? '',
        imageUrl: '',
        quantity: item.quantity ?? 1,
        itemSubtotal: item.priceAfterItemDiscount ?? item.price ?? 0,
        originalSubtotal: item.price ?? item.priceAfterItemDiscount ?? 0,
        variants: [],
        promotions: [],
        coupons: []
    }))
    return {
        id: order?.orderNo ?? '',
        orderedOn: order?.creationDate ?? new Date().toISOString(),
        currencyCode,
        items,
        subtotal: order?.productSubTotal ?? 0,
        total: order?.orderTotal ?? 0,
        taxes: order?.taxTotal ?? null,
        shippingCost: order?.shippingTotal ?? null,
        shippingDiscount: null,
        shippingPromotions: [],
        promotionsDiscount: null,
        promotions: [],
        couponsDiscount: null,
        couponsApplied: (order?.couponItems ?? []).map((c) => c.code).filter(Boolean),
        headerMessage: null,
        bodyMessage: null,
        footerMessage: null
    }
}

// Hidden developer smoke page for SFPaymentsExpressAgent.
// Uses the current shopper basket for a realistic Apple Pay / Google Pay round-trip while
// keeping the widget-context navigation contract in force: on success we DO NOT navigate to
// /checkout/confirmation — we render the returned order payload right here so a developer can
// eyeball what the widget host would receive.
//
// iframe way — this page doubles as the iframe target for the tile-extension
// mechanism comparison. When loaded with ?productId=<id>, it prepares a temp
// basket for that specific product (instead of using the current shopper
// basket) and postMessages the mapped OrderDetails to window.parent on
// completion. The parent (Cimulate widget) routes that through the same
// appendOrderConfirmation API the slot path uses.
const SFPaymentsExpressAgentSmoke = () => {
    const {data: basket} = useCurrentBasket()
    const [lastEvent, setLastEvent] = useState(null)

    // iframe way — productId query param triggers temp-basket branch below.
    // amount + currency are passed alongside so the SF Payments SDK can
    // initialize without waiting for a shopper basket to load (an iframe
    // context bootstraps a fresh session with an empty basket, so basket-
    // derived amounts are undefined at first render).
    const searchParams = new URLSearchParams(useLocation().search)
    const productId = searchParams.get('productId')
    const iframeAmount = searchParams.get('amount')
    const iframeCurrency = searchParams.get('currency')
    const {mutateAsync: createBasket} = useShopperBasketsMutation('createBasket')
    const {mutateAsync: addItemToBasket} = useShopperBasketsMutation('addItemToBasket')
    const cleanupTemporaryBaskets = useCleanupTemporaryBaskets()

    const prepareBasket = useCallback(async () => {
        // iframe way — when embedded from Cimulate with a productId, mirror the
        // slot adapter's temp-basket flow (see tile-extension-adapter.jsx).
        if (productId) {
            await cleanupTemporaryBaskets()
            const newBasket = await createBasket({parameters: {temporary: true}, body: {}})
            return addItemToBasket({
                parameters: {basketId: newBasket.basketId},
                body: [{productId, quantity: 1}]
            })
        }
        return basket
    }, [productId, basket?.basketId, cleanupTemporaryBaskets, createBasket, addItemToBasket])

    const [paymentCurrency, paymentCountryCode, initialAmount] = useMemo(
        () => [
            // iframe way — when productId is set, prefer query-param values
            // (basket is empty on iframe bootstrap and would give undefined).
            productId ? iframeCurrency : basket?.currency,
            basket?.billingAddress?.countryCode,
            productId
                ? iframeAmount
                    ? Number(iframeAmount)
                    : undefined
                : basket?.orderTotal || basket?.productSubTotal
        ],
        [basket?.basketId, productId, iframeCurrency, iframeAmount]
    )

    const onComplete = (order) => {
        // eslint-disable-next-line no-console
        console.log('[sf-payments-express-agent-smoke] onComplete', order)
        setLastEvent({type: 'complete', payload: order})
        // iframe way — spike shortcut: postMessage to parent so Cimulate can call
        // appendOrderConfirmation with the same shape the slot path produces.
        // Production Flavor B would route order confirmation through the
        // Agentforce server (like cart-summary), NOT via postMessage.
        if (productId && typeof window !== 'undefined' && window.parent !== window) {
            window.parent.postMessage(
                {
                    type: 'sf-express-order-complete',
                    order: scapiOrderToOrderDetails(order)
                },
                '*' // spike-only; tighten to Cimulate widget origin before productization
            )
        }
    }
    const onCancel = () => {
        // eslint-disable-next-line no-console
        console.log('[sf-payments-express-agent-smoke] onCancel')
        setLastEvent({type: 'cancel'})
    }
    const onError = (err) => {
        // eslint-disable-next-line no-console
        console.log('[sf-payments-express-agent-smoke] onError', err)
        setLastEvent({type: 'error', payload: err})
    }

    return (
        <Box data-testid="sf-payments-express-agent-smoke-page" bg="gray.50" py={[8, 16]}>
            <Container maxW="container.md" bg="white" p={8} borderRadius="base">
                <VStack align="stretch" spacing={4}>
                    <Heading size="md">SFPaymentsExpressAgent smoke</Heading>
                    <Text fontSize="sm" color="gray.600">
                        Developer-only page. Add an item to the cart first, then use the buttons
                        below to run through an Apple Pay / Google Pay checkout. The page should
                        NOT navigate to /checkout/confirmation on success.
                    </Text>

                    {/* iframe way — when productId is set, skip the basket precheck:
                        prepareBasket() creates a temp basket on-demand for that product. */}
                    {basket?.basketId || productId ? (
                        <SFPaymentsExpressAgent
                            prepareBasket={prepareBasket}
                            paymentCurrency={paymentCurrency}
                            paymentCountryCode={paymentCountryCode}
                            initialAmount={initialAmount}
                            onComplete={onComplete}
                            onCancel={onCancel}
                            onError={onError}
                        />
                    ) : (
                        <Text data-testid="no-basket" color="red.500">
                            No basket found. Visit /cart and add an item, then reload.
                        </Text>
                    )}

                    {lastEvent && (
                        <Box>
                            <Text fontWeight="bold">Last event: {lastEvent.type}</Text>
                            <Code
                                data-testid="last-event-payload"
                                display="block"
                                whiteSpace="pre"
                                p={3}
                                mt={2}
                            >
                                {JSON.stringify(lastEvent.payload ?? null, null, 2)}
                            </Code>
                        </Box>
                    )}
                </VStack>
            </Container>
        </Box>
    )
}

SFPaymentsExpressAgentSmoke.getTemplateName = () => 'sf-payments-express-agent-smoke'

SFPaymentsExpressAgentSmoke.propTypes = {}

export default SFPaymentsExpressAgentSmoke
