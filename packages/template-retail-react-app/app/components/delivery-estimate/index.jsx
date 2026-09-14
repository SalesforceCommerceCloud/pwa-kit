/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import PropTypes from 'prop-types'
import {useDeliveryEstimates} from '@salesforce/commerce-sdk-react'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Stack,
    Text,
    VisuallyHidden
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    getSlowestDeliveryEstimate,
    getStoredDestination,
    isValidDestination,
    normalizeDestination
} from '@salesforce/retail-react-app/app/components/delivery-estimate/utils'
import Link from '@salesforce/retail-react-app/app/components/link'

const getStorageKey = (siteId) => `deliveryDestination_${siteId}`

const formatDeliveryWindow = (deliveryWindow, formatDate) => {
    const startAt = new Date(deliveryWindow.startAt)
    const endAt = new Date(deliveryWindow.endAt)
    const dateFormat = {year: 'numeric', month: 'short', day: 'numeric'}

    const startLabel = formatDate(startAt, dateFormat)
    const endLabel = formatDate(endAt, dateFormat)

    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

const DeliveryEstimate = ({
    productId,
    siteId,
    defaultCountryCode,
    resultContainer = null,
    showResultInCard = true,
    showCalculator = true,
    showResult = true,
    onResolvedDestination,
    focusPostalCode = false,
    onPostalCodeFocusHandled
}) => {
    const {formatDate, formatMessage} = useIntl()
    const [hydrated, setHydrated] = useState(false)
    const [destination, setDestination] = useState({
        countryCode: defaultCountryCode || '',
        postalCode: ''
    })
    const [submittedDestination, setSubmittedDestination] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})
    const resolvedDestinationRef = useRef(null)
    const postalCodeInputRef = useRef(null)

    useEffect(() => {
        const storedDestination = getStoredDestination(getStorageKey(siteId))
        const countryCode = defaultCountryCode || ''
        const restoredDestination = storedDestination
            ? {countryCode, postalCode: storedDestination.postalCode}
            : null
        setDestination({countryCode, postalCode: storedDestination?.postalCode || ''})
        setSubmittedDestination(restoredDestination)
        setHydrated(true)
    }, [siteId, defaultCountryCode])

    const validDestination = isValidDestination(submittedDestination)
    const canRequest = hydrated && Boolean(productId) && Boolean(siteId) && validDestination
    const {data, isError, isLoading, isFetching} = useDeliveryEstimates(
        {
            parameters: {
                productIds: canRequest ? [productId] : undefined,
                postalCode: submittedDestination?.postalCode,
                countryCode: submittedDestination?.countryCode,
                siteId: siteId || undefined
            }
        },
        {enabled: canRequest}
    )
    const slowestEstimate = canRequest ? getSlowestDeliveryEstimate(productId, data) : null
    const hasMultipleOptions =
        (data?.productDeliveryEstimates || []).find((estimate) => estimate.productId === productId)
            ?.shippingOptions?.length > 1

    useEffect(() => {
        if (
            !slowestEstimate ||
            !submittedDestination ||
            isError ||
            isLoading ||
            isFetching ||
            typeof window === 'undefined'
        ) {
            return
        }

        try {
            window.localStorage.setItem(
                getStorageKey(siteId),
                JSON.stringify(normalizeDestination(submittedDestination))
            )
        } catch {
            // Delivery estimates remain usable when browser storage is unavailable.
        }
    }, [slowestEstimate, submittedDestination, siteId, isError, isLoading, isFetching])

    const handleSubmit = (event) => {
        event.preventDefault()
        const normalizedDestination = normalizeDestination(destination)
        const errors = {
            postalCode: normalizedDestination.postalCode
                ? ''
                : formatMessage(
                      {
                          id: 'delivery_estimate.error.enter_postal_code',
                          defaultMessage:
                              '{countryCode, select, GB {Enter a postcode.} US {Enter a ZIP code.} other {Enter a postal code.}}'
                      },
                      {countryCode: normalizedDestination.countryCode}
                  )
        }
        setDestination(normalizedDestination)
        setValidationErrors(errors)

        if (!isValidDestination(normalizedDestination)) {
            setSubmittedDestination(null)
            return
        }

        resolvedDestinationRef.current = null
        setSubmittedDestination(normalizedDestination)
    }

    const isRequesting = canRequest && (isLoading || isFetching)
    const hasResult = Boolean(slowestEstimate) && !isRequesting && !isError
    const isUnavailable = canRequest && !isRequesting && (isError || (data && !slowestEstimate))
    const calculatingLabel = formatMessage({
        id: 'delivery_estimate.status.loading',
        defaultMessage: 'Calculating...'
    })

    useEffect(() => {
        if (!hasResult || !submittedDestination || !onResolvedDestination) {
            return
        }

        const normalizedDestination = normalizeDestination(submittedDestination)
        const destinationKey = `${productId}:${normalizedDestination.countryCode}:${normalizedDestination.postalCode}`
        if (resolvedDestinationRef.current === destinationKey) {
            return
        }

        resolvedDestinationRef.current = destinationKey
        onResolvedDestination(normalizedDestination)
    }, [hasResult, onResolvedDestination, productId, submittedDestination])

    useEffect(() => {
        if (!showCalculator || !focusPostalCode) {
            return
        }

        postalCodeInputRef.current?.focus()
        onPostalCodeFocusHandled?.()
    }, [focusPostalCode, onPostalCodeFocusHandled, showCalculator])

    const resultContent = (
        <>
            {hasResult && (
                <>
                    <Text
                        mt={3}
                        role="status"
                        data-testid="delivery-estimate-result"
                        fontSize="xs"
                        color="gray.600"
                    >
                        {formatMessage(
                            {
                                id: 'delivery_estimate.status.estimated_arrival',
                                defaultMessage: 'Estimated: {deliveryWindow}'
                            },
                            {
                                deliveryWindow: formatDeliveryWindow(
                                    slowestEstimate.deliveryWindow,
                                    formatDate
                                )
                            }
                        )}
                    </Text>
                    {hasMultipleOptions && (
                        <Link
                            display="inline-block"
                            mt={2}
                            to="/checkout"
                            fontSize="xs"
                            textDecoration="underline"
                        >
                            {formatMessage({
                                id: 'delivery_estimate.link.view_all_shipping_options',
                                defaultMessage: 'View All Shipping Options'
                            })}
                        </Link>
                    )}
                </>
            )}
            {isUnavailable && (
                <Text mt={3} role="status" fontSize="xs" color="gray.600">
                    {formatMessage({
                        id: 'delivery_estimate.status.unavailable',
                        defaultMessage:
                            'Delivery dates unavailable. See checkout for options and costs.'
                    })}
                </Text>
            )}
        </>
    )
    const renderedResult = !showResult
        ? null
        : resultContainer
        ? createPortal(resultContent, resultContainer)
        : showResultInCard
        ? resultContent
        : null

    return (
        <>
            {showCalculator && (
                <Box
                    as="section"
                    aria-labelledby="delivery-estimate-heading"
                    mt={4}
                    mb={4}
                    border="1px"
                    borderColor="gray.200"
                    borderRadius="base"
                    p={3}
                >
                    <Text
                        as="h2"
                        id="delivery-estimate-heading"
                        fontSize="sm"
                        fontWeight={600}
                        mb={3}
                    >
                        {formatMessage({
                            id: 'delivery_estimate.heading',
                            defaultMessage: 'Estimated Delivery Date'
                        })}
                    </Text>
                    <Box as="form" onSubmit={handleSubmit} noValidate>
                        <Stack
                            direction={{base: 'column', md: 'row'}}
                            align={{base: 'stretch', md: 'end'}}
                        >
                            <FormControl
                                isInvalid={Boolean(validationErrors.postalCode)}
                                flex={1}
                                minW={0}
                            >
                                <VisuallyHidden>
                                    <FormLabel htmlFor="delivery-estimate-postal-code">
                                        {formatMessage(
                                            {
                                                id: 'delivery_estimate.label.postal_code',
                                                defaultMessage:
                                                    '{countryCode, select, GB {Postcode} US {ZIP code} other {Postal code}}'
                                            },
                                            {countryCode: destination.countryCode}
                                        )}
                                    </FormLabel>
                                </VisuallyHidden>
                                <Input
                                    ref={postalCodeInputRef}
                                    id="delivery-estimate-postal-code"
                                    name="postalCode"
                                    autoComplete="postal-code"
                                    placeholder={formatMessage({
                                        id: 'delivery_estimate.placeholder.postal_code',
                                        defaultMessage: 'Enter a postal code...'
                                    })}
                                    aria-describedby={
                                        validationErrors.postalCode
                                            ? 'delivery-estimate-postal-code-error'
                                            : undefined
                                    }
                                    value={destination.postalCode}
                                    onChange={(event) => {
                                        setDestination((current) => ({
                                            ...current,
                                            postalCode: event.target.value
                                        }))
                                        setValidationErrors((current) => ({
                                            ...current,
                                            postalCode: ''
                                        }))
                                    }}
                                />
                                <FormErrorMessage id="delivery-estimate-postal-code-error">
                                    {validationErrors.postalCode}
                                </FormErrorMessage>
                            </FormControl>
                            <Button
                                type="submit"
                                variant="outline"
                                isDisabled={!productId || isRequesting}
                                width={{base: '100%', md: 'auto'}}
                                aria-label={
                                    isRequesting
                                        ? calculatingLabel
                                        : formatMessage({
                                              id: 'delivery_estimate.action.calculate_aria_label',
                                              defaultMessage: 'Calculate delivery estimate'
                                          })
                                }
                            >
                                {isRequesting
                                    ? calculatingLabel
                                    : formatMessage({
                                          id: 'delivery_estimate.action.calculate',
                                          defaultMessage: 'Calculate'
                                      })}
                            </Button>
                        </Stack>
                    </Box>

                    {!resultContainer && renderedResult}
                </Box>
            )}
            {resultContainer && renderedResult}
        </>
    )
}

DeliveryEstimate.propTypes = {
    productId: PropTypes.string,
    siteId: PropTypes.string.isRequired,
    defaultCountryCode: PropTypes.string,
    resultContainer: PropTypes.object,
    showResultInCard: PropTypes.bool,
    showCalculator: PropTypes.bool,
    showResult: PropTypes.bool,
    onResolvedDestination: PropTypes.func,
    focusPostalCode: PropTypes.bool,
    onPostalCodeFocusHandled: PropTypes.func
}

export default DeliveryEstimate
