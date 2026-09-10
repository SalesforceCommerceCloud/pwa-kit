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
        setDestination(storedDestination || {countryCode: defaultCountryCode || '', postalCode: ''})
        setSubmittedDestination(storedDestination)
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

        window.localStorage.setItem(
            getStorageKey(siteId),
            JSON.stringify(normalizeDestination(submittedDestination))
        )
    }, [primaryEstimate, submittedDestination, siteId, isError, isLoading, isFetching])

    const handleSubmit = (event) => {
        event.preventDefault()
        const normalizedDestination = normalizeDestination(destination)
        const errors = {
            countryCode: /^[A-Z]{2}$/.test(normalizedDestination.countryCode)
                ? ''
                : formatMessage({
                      id: 'delivery_estimate.error.enter_country_code',
                      defaultMessage: 'Enter a valid country code.'
                  }),
            postalCode: normalizedDestination.postalCode
                ? ''
                : formatMessage({
                      id: 'delivery_estimate.error.enter_postal_code',
                      defaultMessage: 'Enter a postal code.'
                  })
        }
        setDestination(normalizedDestination)
        setValidationErrors(errors)

        if (!isValidDestination(normalizedDestination)) {
            return
        }

        setSubmittedDestination(normalizedDestination)
    }

    const isRequesting = canRequest && (isLoading || isFetching)
    const hasResult = Boolean(primaryEstimate) && !isRequesting && !isError
    const isUnavailable = canRequest && !isRequesting && (isError || (data && !primaryEstimate))

    return (
        <Box as="section" aria-labelledby="delivery-estimate-heading" mt={4}>
            <Text as="h2" id="delivery-estimate-heading" fontWeight={600} mb={3}>
                {formatMessage({
                    id: 'delivery_estimate.heading',
                    defaultMessage: 'Delivery estimate'
                })}
            </Text>
            <Box as="form" onSubmit={handleSubmit} noValidate>
                <Stack direction={{base: 'column', md: 'row'}} align="start">
                    <FormControl isInvalid={Boolean(validationErrors.countryCode)}>
                        <FormLabel htmlFor="delivery-estimate-country-code">
                            {formatMessage({
                                id: 'delivery_estimate.label.country_code',
                                defaultMessage: 'Country code'
                            })}
                        </FormLabel>
                        <Input
                            id="delivery-estimate-country-code"
                            name="countryCode"
                            autoComplete="country"
                            maxLength={2}
                            value={destination.countryCode}
                            onChange={(event) => {
                                setDestination((current) => ({
                                    ...current,
                                    countryCode: event.target.value
                                }))
                                setValidationErrors((current) => ({...current, countryCode: ''}))
                            }}
                        />
                        <FormErrorMessage>{validationErrors.countryCode}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={Boolean(validationErrors.postalCode)}>
                        <FormLabel htmlFor="delivery-estimate-postal-code">
                            {formatMessage({
                                id: 'delivery_estimate.label.postal_code',
                                defaultMessage: 'Postal code'
                            })}
                        </FormLabel>
                        <Input
                            id="delivery-estimate-postal-code"
                            name="postalCode"
                            autoComplete="postal-code"
                            value={destination.postalCode}
                            onChange={(event) => {
                                setDestination((current) => ({
                                    ...current,
                                    postalCode: event.target.value
                                }))
                                setValidationErrors((current) => ({...current, postalCode: ''}))
                            }}
                        />
                        <FormErrorMessage>{validationErrors.postalCode}</FormErrorMessage>
                    </FormControl>
                    <Box pt={8}>
                        <Button type="submit" variant="outline" isDisabled={!productId}>
                            {formatMessage({
                                id: 'delivery_estimate.action.check_delivery',
                                defaultMessage: 'Check delivery'
                            })}
                        </Button>
                    </Box>
                </Stack>
            </Box>

            {isRequesting && (
                <HStack mt={3} role="status">
                    <Spinner size="sm" />
                    <Text>
                        {formatMessage({
                            id: 'delivery_estimate.status.loading',
                            defaultMessage: 'Checking delivery estimate...'
                        })}
                    </Text>
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
                        defaultMessage: 'A delivery estimate is unavailable for this destination.'
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
