/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useDeliveryEstimates} from '@salesforce/commerce-sdk-react'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    HStack,
    Input,
    Stack,
    Spinner,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    getPrimaryDeliveryEstimate,
    getStoredDestination,
    isValidDestination,
    normalizeDestination
} from '@salesforce/retail-react-app/app/components/delivery-estimate/utils'

const getStorageKey = (siteId) => `deliveryDestination_${siteId}`

const formatDeliveryWindow = (deliveryWindow, formatDate) => {
    const startAt = new Date(deliveryWindow.startAt)
    const endAt = new Date(deliveryWindow.endAt)
    const dateFormat = {year: 'numeric', month: 'short', day: 'numeric'}

    const startLabel = formatDate(startAt, dateFormat)
    const endLabel = formatDate(endAt, dateFormat)

    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

const DeliveryEstimate = ({productId, siteId, defaultCountryCode}) => {
    const {formatDate, formatMessage} = useIntl()
    const [hydrated, setHydrated] = useState(false)
    const [destination, setDestination] = useState({
        countryCode: defaultCountryCode || '',
        postalCode: ''
    })
    const [submittedDestination, setSubmittedDestination] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})

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
    const primaryEstimate = canRequest ? getPrimaryDeliveryEstimate(productId, data) : null

    useEffect(() => {
        if (
            !primaryEstimate ||
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
    }, [primaryEstimate, submittedDestination, siteId, isError, isLoading, isFetching])

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

        setSubmittedDestination(normalizedDestination)
    }

    const isRequesting = canRequest && (isLoading || isFetching)
    const hasResult = Boolean(primaryEstimate) && !isRequesting && !isError
    const isUnavailable = canRequest && !isRequesting && (isError || (data && !primaryEstimate))
    const calculatingLabel = formatMessage({
        id: 'delivery_estimate.status.loading',
        defaultMessage: 'Calculating...'
    })

    return (
        <Box as="section" aria-labelledby="delivery-estimate-heading" mt={4}>
            <Text as="h2" id="delivery-estimate-heading" fontWeight={600} mb={3}>
                {formatMessage({
                    id: 'delivery_estimate.heading',
                    defaultMessage: 'Estimated Delivery Date'
                })}
            </Text>
            <Box as="form" onSubmit={handleSubmit} noValidate>
                <Stack direction={{base: 'column', md: 'row'}} align="start">
                    <FormControl isInvalid={Boolean(validationErrors.postalCode)}>
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
                        <Text id="delivery-estimate-postal-code-instructions" fontSize="sm" mb={2}>
                            {formatMessage(
                                {
                                    id: 'delivery_estimate.instructions.postal_code',
                                    defaultMessage:
                                        '{countryCode, select, GB {Enter your postcode (e.g. SW1A 1AA) to see delivery estimates.} US {Enter your ZIP code (e.g. 90210) to see delivery estimates.} other {Enter your postal code to see delivery estimates.}}'
                                },
                                {countryCode: destination.countryCode}
                            )}
                        </Text>
                        <Input
                            id="delivery-estimate-postal-code"
                            name="postalCode"
                            autoComplete="postal-code"
                            aria-describedby={
                                validationErrors.postalCode
                                    ? 'delivery-estimate-postal-code-error'
                                    : 'delivery-estimate-postal-code-instructions'
                            }
                            value={destination.postalCode}
                            onChange={(event) => {
                                setDestination((current) => ({
                                    ...current,
                                    postalCode: event.target.value
                                }))
                                setValidationErrors((current) => ({...current, postalCode: ''}))
                            }}
                        />
                        <FormErrorMessage id="delivery-estimate-postal-code-error">
                            {validationErrors.postalCode}
                        </FormErrorMessage>
                    </FormControl>
                    <Box pt={8}>
                        <Button
                            type="submit"
                            variant="outline"
                            isDisabled={!productId || isRequesting}
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
                    </Box>
                </Stack>
            </Box>

            {isRequesting && (
                <HStack mt={3} role="status">
                    <Spinner size="sm" />
                    <Text>{calculatingLabel}</Text>
                </HStack>
            )}
            {hasResult && (
                <Text mt={3} role="status" data-testid="delivery-estimate-result">
                    {primaryEstimate.name && `${primaryEstimate.name}: `}
                    {formatDeliveryWindow(primaryEstimate.deliveryWindow, formatDate)}
                </Text>
            )}
            {isUnavailable && (
                <Text mt={3} role="status">
                    {formatMessage({
                        id: 'delivery_estimate.status.unavailable',
                        defaultMessage:
                            'Delivery dates unavailable. See checkout for options and costs.'
                    })}
                </Text>
            )}
        </Box>
    )
}

DeliveryEstimate.propTypes = {
    productId: PropTypes.string,
    siteId: PropTypes.string.isRequired,
    defaultCountryCode: PropTypes.string
}

export default DeliveryEstimate
