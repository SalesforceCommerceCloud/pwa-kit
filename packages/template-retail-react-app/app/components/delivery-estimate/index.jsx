/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import PropTypes from 'prop-types'
import {useDeliveryEstimates, useProduct} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getDefaultCookieAttributes} from '@salesforce/commerce-sdk-react/utils'
import {defineMessages, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useDisclosure,
    VisuallyHidden
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    getFallbackDeliveryDescription,
    getPreferredDeliveryDestination,
    getFastestDeliveryEstimate,
    getPostalCodeFormat,
    isEligibleShippingOption,
    isValidDestination,
    normalizeCountryCode,
    normalizeDestination
} from '@salesforce/retail-react-app/app/components/delivery-estimate/utils'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const getDeliveryZipCodeCookieName = (siteId) => `deliveryZipCode_${siteId}`
const DELIVERY_DESTINATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const POSTAL_CODE_SANITY_RE = /^[A-Z0-9](?:[A-Z0-9 -]{0,10}[A-Z0-9])?$/i
const DELIVERY_ESTIMATE_INSTRUCTIONS_ID = 'delivery-estimate-postal-code-instructions'
const DELIVERY_ESTIMATE_ERROR_ID = 'delivery-estimate-postal-code-error'

const normalizePostalCode = (value) => {
    const postalCode = value?.trim()
    return postalCode && postalCode.length <= 12 && POSTAL_CODE_SANITY_RE.test(postalCode)
        ? postalCode
        : null
}

const parseDeliveryDestinationCookie = (cookieName) => {
    const escapedCookieName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedCookieName}=([^;]+)`))
    if (!match) return null

    try {
        const value = decodeURIComponent(match[1])
        const legacyPostalCode = normalizePostalCode(value)
        if (legacyPostalCode) {
            return {postalCode: legacyPostalCode}
        }

        const destination = JSON.parse(value)
        if (typeof destination.postalCode !== 'string') return null

        const postalCode = normalizePostalCode(destination.postalCode)
        const countryCode = normalizeCountryCode(destination.countryCode)
        if (!postalCode || (destination.countryCode !== undefined && !countryCode)) return null

        return {postalCode, ...(countryCode ? {countryCode} : {})}
    } catch {
        return null
    }
}

const persistDeliveryDestinationCookie = (siteId, destination) => {
    const cookieName = getDeliveryZipCodeCookieName(siteId)
    const postalCode = normalizePostalCode(destination?.postalCode)
    const countryCode = normalizeCountryCode(destination?.countryCode)
    if (!postalCode || (destination?.countryCode !== undefined && !countryCode)) return

    const value = encodeURIComponent(
        JSON.stringify({
            postalCode,
            ...(countryCode ? {countryCode} : {})
        })
    )
    const cookieDomain = getConfig()?.app?.commerceAPI?.cookieDomain
    const {secure, sameSite} = getDefaultCookieAttributes()
    const attributes = [
        ...(cookieDomain ? [`Domain=${cookieDomain}`] : []),
        'Path=/',
        `Max-Age=${DELIVERY_DESTINATION_COOKIE_MAX_AGE}`,
        ...(secure ? ['Secure'] : []),
        `SameSite=${sameSite}`,
        ...(sameSite?.toLowerCase() === 'none' ? ['Partitioned'] : [])
    ]

    document.cookie = `${cookieName}=${value}; ${attributes.join('; ')}`
}

const formatDeliveryWindow = (deliveryWindow, formatDate) => {
    const startAt = new Date(deliveryWindow.startAt)
    const endAt = new Date(deliveryWindow.endAt)
    const dateFormat = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(startAt.getUTCFullYear() !== endAt.getUTCFullYear() ? {year: 'numeric'} : {}),
        timeZone: 'UTC'
    }

    const startLabel = formatDate(startAt, dateFormat)
    const endLabel = formatDate(endAt, dateFormat)

    return startLabel === endLabel ? startLabel : `${startLabel} \u2013 ${endLabel}`
}

const formatShippingCost = (shippingOption, formatNumber, freeLabel, fallbackCurrency) => {
    if (shippingOption.price === undefined || shippingOption.price === null) {
        return null
    }

    return shippingOption.price === 0
        ? freeLabel
        : formatNumber(shippingOption.price, {
              style: 'currency',
              currency: shippingOption.currency || fallbackCurrency
          })
}

const postalCodeTermMessages = defineMessages({
    zip: {id: 'delivery_estimate.postal_term.zip', defaultMessage: 'ZIP code'},
    postalCode: {id: 'delivery_estimate.postal_term.postal_code', defaultMessage: 'postal code'},
    postcode: {id: 'delivery_estimate.postal_term.postcode', defaultMessage: 'postcode'},
    cap: {id: 'delivery_estimate.postal_term.cap', defaultMessage: 'CAP'},
    eircode: {id: 'delivery_estimate.postal_term.eircode', defaultMessage: 'Eircode'}
})

const postalCodeMessages = defineMessages({
    placeholder: {
        id: 'delivery_estimate.placeholder.postal_code',
        defaultMessage: 'Enter {term}'
    },
    placeholderExample: {
        id: 'delivery_estimate.placeholder.postal_code_example',
        defaultMessage: 'Enter {term} (e.g. {example})'
    },
    instructions: {
        id: 'delivery_estimate.instructions.postal_code',
        defaultMessage: 'Enter your {term} (e.g. {example}) to see delivery estimates.'
    },
    instructionsNoExample: {
        id: 'delivery_estimate.instructions.postal_code_no_example',
        defaultMessage: 'Enter your {term} to see delivery estimates.'
    },
    invalid: {
        id: 'delivery_estimate.error.invalid_postal_code',
        defaultMessage: 'Enter a valid {term} (e.g. {example}).'
    },
    invalidNoExample: {
        id: 'delivery_estimate.error.invalid_postal_code_no_example',
        defaultMessage: 'Enter a valid {term}.'
    }
})

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
    const {formatDate, formatMessage, formatNumber} = useIntl()
    const {currency: activeCurrency} = useCurrency()
    const {data: customer} = useCurrentCustomer()
    const {isOpen, onOpen, onClose} = useDisclosure()
    const [hydrated, setHydrated] = useState(false)
    const [destination, setDestination] = useState({
        countryCode: defaultCountryCode || '',
        postalCode: ''
    })
    const [submittedDestination, setSubmittedDestination] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})
    const resolvedDestinationRef = useRef(null)
    const hasExplicitDestinationRef = useRef(false)
    const hasEditedDestinationRef = useRef(false)
    const shouldFocusResultRef = useRef(false)
    const postalCodeInputRef = useRef(null)
    const estimateResultRef = useRef(null)
    const postalCodeFormat = getPostalCodeFormat(destination.countryCode || defaultCountryCode)
    const postalCodeTerm = formatMessage(
        postalCodeTermMessages[postalCodeFormat.termKey] || postalCodeTermMessages.postalCode
    )
    const postalCodeMessageValues = {term: postalCodeTerm, example: postalCodeFormat.example}
    const postalCodePlaceholder = formatMessage(
        postalCodeFormat.example
            ? postalCodeMessages.placeholderExample
            : postalCodeMessages.placeholder,
        postalCodeMessageValues
    )
    const postalCodeInstructions = formatMessage(
        postalCodeFormat.example
            ? postalCodeMessages.instructions
            : postalCodeMessages.instructionsNoExample,
        postalCodeMessageValues
    )
    const postalCodeInvalid = formatMessage(
        postalCodeFormat.example ? postalCodeMessages.invalid : postalCodeMessages.invalidNoExample,
        postalCodeMessageValues
    )

    useEffect(() => {
        hasExplicitDestinationRef.current = false
        hasEditedDestinationRef.current = false
        const cookieDestination = parseDeliveryDestinationCookie(
            getDeliveryZipCodeCookieName(siteId)
        )
        const restoredDestination = normalizeDestination({
            countryCode: cookieDestination?.countryCode || defaultCountryCode || '',
            postalCode: cookieDestination?.postalCode || ''
        })
        const destination = isValidDestination(restoredDestination) ? restoredDestination : null
        setDestination(restoredDestination)
        setSubmittedDestination(destination)
        shouldFocusResultRef.current = false
        setHydrated(true)
    }, [siteId, defaultCountryCode])

    useEffect(() => {
        if (!hydrated || submittedDestination || hasEditedDestinationRef.current) {
            return
        }

        if (!customer?.isRegistered) {
            return
        }

        const profileDestination = getPreferredDeliveryDestination(
            customer?.addresses,
            defaultCountryCode
        )
        if (!profileDestination) return

        setDestination(profileDestination)
        setSubmittedDestination(profileDestination)
    }, [
        customer?.addresses,
        customer?.isRegistered,
        defaultCountryCode,
        hydrated,
        submittedDestination
    ])

    const validDestination = isValidDestination(submittedDestination)
    const canRequest = hydrated && Boolean(productId) && Boolean(siteId) && validDestination
    const {data, error, isError, isLoading, isFetching} = useDeliveryEstimates(
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
    const fastestEstimate = canRequest ? getFastestDeliveryEstimate(productId, data) : null
    const shippingOptions =
        (data?.productDeliveryEstimates || [])
            .find((estimate) => estimate.productId === productId)
            ?.shippingOptions?.filter(isEligibleShippingOption) || []
    const hasMultipleOptions = shippingOptions.length > 1

    useEffect(() => {
        if (
            !fastestEstimate ||
            !submittedDestination ||
            isError ||
            isLoading ||
            isFetching ||
            !hasExplicitDestinationRef.current ||
            typeof window === 'undefined'
        ) {
            return
        }

        persistDeliveryDestinationCookie(siteId, submittedDestination)
        hasExplicitDestinationRef.current = false
    }, [fastestEstimate, submittedDestination, siteId, isError, isLoading, isFetching])

    const handleSubmit = (event) => {
        event.preventDefault()
        const normalizedDestination = normalizeDestination(destination)
        const errors = {
            postalCode: isValidDestination(normalizedDestination) ? '' : postalCodeInvalid
        }
        setDestination(normalizedDestination)
        setValidationErrors(errors)

        if (!isValidDestination(normalizedDestination)) {
            setSubmittedDestination(null)
            return
        }

        resolvedDestinationRef.current = null
        hasExplicitDestinationRef.current = true
        shouldFocusResultRef.current = true
        setSubmittedDestination(normalizedDestination)
    }

    const isRequesting = canRequest && (isLoading || isFetching)
    const hasResult = Boolean(fastestEstimate) && !isRequesting && !isError
    const isUnavailable = canRequest && !isRequesting && (isError || (data && !fastestEstimate))
    const showPostalCodeInstructions =
        !isRequesting && !hasResult && !isUnavailable && !validationErrors.postalCode
    const shouldFetchFallbackDeliveryDescription =
        isUnavailable && [403, 500].includes(error?.response?.status)
    const {data: fallbackProduct} = useProduct(
        {
            parameters: {
                id: shouldFetchFallbackDeliveryDescription ? productId : undefined,
                expand: shouldFetchFallbackDeliveryDescription ? ['shipping_methods'] : undefined
            }
        },
        {enabled: shouldFetchFallbackDeliveryDescription}
    )
    const fallbackDeliveryDescription = shouldFetchFallbackDeliveryDescription
        ? getFallbackDeliveryDescription(fallbackProduct?.shippingMethods)
        : null
    const calculatingLabel = formatMessage({
        id: 'delivery_estimate.status.loading',
        defaultMessage: 'Calculating...'
    })
    const freeLabel = formatMessage({
        id: 'checkout_confirmation.label.free',
        defaultMessage: 'Free'
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
        if (!hasResult || !shouldFocusResultRef.current) {
            return
        }

        estimateResultRef.current?.focus()
        shouldFocusResultRef.current = false
    }, [hasResult])

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
                        ref={estimateResultRef}
                        mt={3}
                        role="status"
                        aria-live="polite"
                        tabIndex={-1}
                        data-testid="delivery-estimate-result"
                        fontSize="xs"
                        color="gray.600"
                    >
                        {formatMessage(
                            {
                                id: 'delivery_estimate.status.estimated_arrival',
                                defaultMessage: 'Arrives {deliveryWindow}'
                            },
                            {
                                deliveryWindow: formatDeliveryWindow(
                                    fastestEstimate.deliveryWindow,
                                    formatDate
                                )
                            }
                        )}
                    </Text>
                    {hasMultipleOptions && (
                        <Button
                            variant="link"
                            display="block"
                            mt={2}
                            fontSize="xs"
                            fontWeight="normal"
                            minWidth="auto"
                            textDecoration="underline"
                            onClick={onOpen}
                        >
                            {formatMessage({
                                id: 'delivery_estimate.link.view_all_shipping_options',
                                defaultMessage: 'More Delivery Options'
                            })}
                        </Button>
                    )}
                </>
            )}
            {isUnavailable && (
                <Text mt={3} role="status" fontSize="xs" color="gray.600">
                    {fallbackDeliveryDescription ||
                        formatMessage({
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
                                        {postalCodeTerm}
                                    </FormLabel>
                                </VisuallyHidden>
                                <Input
                                    ref={postalCodeInputRef}
                                    id="delivery-estimate-postal-code"
                                    name="postalCode"
                                    autoComplete="postal-code"
                                    inputMode={postalCodeFormat.inputMode}
                                    maxLength={postalCodeFormat.maxLength}
                                    aria-invalid={Boolean(validationErrors.postalCode)}
                                    placeholder={postalCodePlaceholder}
                                    aria-describedby={
                                        validationErrors.postalCode
                                            ? DELIVERY_ESTIMATE_ERROR_ID
                                            : showPostalCodeInstructions
                                            ? DELIVERY_ESTIMATE_INSTRUCTIONS_ID
                                            : undefined
                                    }
                                    value={destination.postalCode}
                                    onChange={(event) => {
                                        hasEditedDestinationRef.current = true
                                        setSubmittedDestination(null)
                                        setDestination((current) => ({
                                            ...current,
                                            postalCode: postalCodeFormat.normalize(
                                                event.target.value
                                            )
                                        }))
                                        setValidationErrors((current) => ({
                                            ...current,
                                            postalCode: ''
                                        }))
                                    }}
                                />
                                <FormErrorMessage id={DELIVERY_ESTIMATE_ERROR_ID}>
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

                    {showPostalCodeInstructions && (
                        <Text
                            id={DELIVERY_ESTIMATE_INSTRUCTIONS_ID}
                            mt={3}
                            fontSize="xs"
                            color="gray.600"
                        >
                            {postalCodeInstructions}
                        </Text>
                    )}

                    {(!resultContainer || !showResult) &&
                        (renderedResult || (isUnavailable && resultContent))}
                </Box>
            )}
            {resultContainer && renderedResult}
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {formatMessage({
                            id: 'delivery_estimate.modal.heading',
                            defaultMessage: 'Shipping Options'
                        })}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Stack spacing={3}>
                            {shippingOptions.map((shippingOption) => {
                                const shippingCost = formatShippingCost(
                                    shippingOption,
                                    formatNumber,
                                    freeLabel,
                                    activeCurrency
                                )
                                return (
                                    <Box
                                        key={shippingOption.shippingMethodId}
                                        border="1px"
                                        borderColor="gray.200"
                                        borderRadius="base"
                                        p={3}
                                    >
                                        <Flex align="start" justify="space-between" gap={4}>
                                            <Box>
                                                <Text fontWeight={600}>
                                                    {shippingOption.name ||
                                                        shippingOption.carrier ||
                                                        shippingOption.shippingMethodId}
                                                </Text>
                                                {shippingOption.deliveryWindow && (
                                                    <Text fontSize="sm" color="gray.600">
                                                        {formatDeliveryWindow(
                                                            shippingOption.deliveryWindow,
                                                            formatDate
                                                        )}
                                                    </Text>
                                                )}
                                            </Box>
                                            {shippingCost && (
                                                <Text fontWeight={600}>{shippingCost}</Text>
                                            )}
                                        </Flex>
                                        {shippingOption.description && (
                                            <Text mt={2} fontSize="xs" color="gray.600">
                                                {shippingOption.description}
                                            </Text>
                                        )}
                                    </Box>
                                )
                            })}
                        </Stack>
                    </ModalBody>
                </ModalContent>
            </Modal>
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
