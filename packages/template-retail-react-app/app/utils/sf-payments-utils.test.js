/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    buildTheme,
    getSFPaymentsInstrument,
    transformAddressDetails,
    transformShippingMethods,
    getSelectedShippingMethodId,
    isShippingMethodValid,
    isPayPalPaymentMethodType,
    createPaymentInstrumentBody
} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'

describe('sf-payments-utils', () => {
    describe('getSFPaymentsInstrument', () => {
        test('returns undefined when basketOrOrder is undefined', () => {
            const result = getSFPaymentsInstrument(undefined)
            expect(result).toBeUndefined()
        })

        test('returns undefined when basketOrOrder is null', () => {
            const result = getSFPaymentsInstrument(null)
            expect(result).toBeUndefined()
        })

        test('returns undefined when paymentInstruments is undefined', () => {
            const basketOrOrder = {}
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toBeUndefined()
        })

        test('returns undefined when paymentInstruments is empty', () => {
            const basketOrOrder = {
                paymentInstruments: []
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toBeUndefined()
        })

        test('returns undefined when no Salesforce Payments instruments exist', () => {
            const basketOrOrder = {
                paymentInstruments: [
                    {paymentMethodId: 'CREDIT_CARD', amount: 100},
                    {paymentMethodId: 'PAYPAL', amount: 50}
                ]
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toBeUndefined()
        })

        test('returns first Salesforce Payments instrument', () => {
            const sfPaymentInstrument = {
                paymentMethodId: 'Salesforce Payments',
                amount: 100,
                paymentInstrumentId: 'test-id'
            }
            const basketOrOrder = {
                paymentInstruments: [
                    {paymentMethodId: 'CREDIT_CARD', amount: 50},
                    sfPaymentInstrument
                ]
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toEqual(sfPaymentInstrument)
        })

        test('returns first Salesforce Payments instrument when multiple exist', () => {
            const sfPaymentInstrument1 = {
                paymentMethodId: 'Salesforce Payments',
                amount: 100,
                paymentInstrumentId: 'test-id-1'
            }
            const sfPaymentInstrument2 = {
                paymentMethodId: 'Salesforce Payments',
                amount: 50,
                paymentInstrumentId: 'test-id-2'
            }
            const basketOrOrder = {
                paymentInstruments: [
                    {paymentMethodId: 'CREDIT_CARD', amount: 25},
                    sfPaymentInstrument1,
                    {paymentMethodId: 'PAYPAL', amount: 75},
                    sfPaymentInstrument2
                ]
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toEqual(sfPaymentInstrument1)
        })

        test('returns first Salesforce Payments instrument from mixed array', () => {
            const basketOrOrder = {
                paymentInstruments: [
                    {paymentMethodId: 'CREDIT_CARD', amount: 10},
                    {
                        paymentMethodId: 'Salesforce Payments',
                        amount: 20,
                        paymentInstrumentId: 'first'
                    },
                    {paymentMethodId: 'PAYPAL', amount: 30},
                    {
                        paymentMethodId: 'Salesforce Payments',
                        amount: 40,
                        paymentInstrumentId: 'second'
                    },
                    {paymentMethodId: 'GIFT_CARD', amount: 50}
                ]
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result.paymentMethodId).toBe('Salesforce Payments')
            expect(result.paymentInstrumentId).toBe('first')
        })

        test('works with basket object', () => {
            const basket = {
                basketId: 'basket-123',
                paymentInstruments: [{paymentMethodId: 'Salesforce Payments', amount: 100}]
            }
            const result = getSFPaymentsInstrument(basket)
            expect(result.paymentMethodId).toBe('Salesforce Payments')
        })

        test('works with order object', () => {
            const order = {
                orderNo: 'order-123',
                paymentInstruments: [{paymentMethodId: 'Salesforce Payments', amount: 100}]
            }
            const result = getSFPaymentsInstrument(order)
            expect(result.paymentMethodId).toBe('Salesforce Payments')
        })

        test('maintains original payment instrument properties', () => {
            const sfPaymentInstrument = {
                paymentMethodId: 'Salesforce Payments',
                amount: 100,
                paymentInstrumentId: 'test-id',
                paymentReference: {
                    paymentReferenceId: 'ref-123',
                    clientSecret: 'secret-abc'
                },
                customProperty: 'custom-value'
            }
            const basketOrOrder = {
                paymentInstruments: [sfPaymentInstrument]
            }
            const result = getSFPaymentsInstrument(basketOrOrder)
            expect(result).toEqual(sfPaymentInstrument)
            expect(result.paymentReference).toEqual(sfPaymentInstrument.paymentReference)
            expect(result.customProperty).toBe('custom-value')
        })
    })

    describe('buildTheme', () => {
        describe('default theme structure', () => {
            test('returns theme object with all required properties', () => {
                const theme = buildTheme()

                expect(theme).toHaveProperty('designTokens')
                expect(theme).toHaveProperty('rules')
                expect(theme).toHaveProperty('expressButtons')
            })

            test('returns correct design tokens', () => {
                const theme = buildTheme()

                expect(theme.designTokens).toEqual({
                    'font-family':
                        '-apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                    'font-weight-regular': '400',
                    'font-weight-bold': '700',
                    'font-size-2': '8px',
                    'font-size-3': '12px',
                    'font-size-4': '16px',
                    'font-size-5': '17px',
                    'font-size-6': '18px',
                    'line-height-text': '1.5',
                    'color-text-default': '#181818',
                    'color-text-error': '#ea001e',
                    'color-text-placeholder': '#939393',
                    'color-text-weak': '#5c5c5c',
                    'color-background': 'rgba(0, 0, 0, 0)',
                    'color-brand': '#1b96ff',
                    'color-text-brand-primary': '#ffffff',
                    'color-text-inverse': '#ffffff',
                    'color-border-input': '#939393',
                    'border-radius-medium': '4px',
                    'border-radius-small': '2px',
                    'spacing-large': '24px',
                    'spacing-medium': '16px',
                    'spacing-small': '12px',
                    'spacing-x-large': '32px',
                    'spacing-x-small': '8px',
                    'spacing-xx-small': '4px',
                    'spacing-xxx-small': '2px'
                })
            })

            test('returns correct rules configuration', () => {
                const theme = buildTheme()

                expect(theme.rules).toEqual({
                    button: {
                        'border-radius': '4px'
                    },
                    input: {
                        'border-radius': '4px',
                        margin: '0 0 4px 0',
                        padding: '6px 12px',
                        focus: {
                            border: '1px solid #1b96ff',
                            'box-shadow': '0 0 0 1px #1b96ff',
                            outline: '2px solid transparent',
                            transition:
                                'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
                        },
                        invalid: {
                            border: '1px solid #ea001e',
                            'box-shadow': '0 0 0 1px #ea001e',
                            outline: '2px solid transparent',
                            transition:
                                'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
                        }
                    },
                    formLabel: {
                        'font-size': '14px',
                        'font-weight': '600',
                        margin: '12px 0 0 0',
                        padding: '0 12px 4px 0',
                        transition:
                            'background-color,border-color,color,fill,stroke,opacity,box-shadow,transform'
                    },
                    error: {
                        color: '#ea001e',
                        'font-size': '14px'
                    }
                })
            })

            test('returns default express buttons configuration', () => {
                const theme = buildTheme()

                expect(theme.expressButtons).toEqual({
                    buttonLayout: 'vertical',
                    buttonShape: 'pill',
                    buttonHeight: 44,
                    buttonColors: {
                        applepay: 'black',
                        googlepay: 'black',
                        paypal: 'gold',
                        venmo: 'blue'
                    },
                    buttonLabels: {
                        applepay: 'plain',
                        googlepay: 'plain',
                        paypal: 'paypal',
                        venmo: 'paypal'
                    }
                })
            })
        })

        describe('custom options', () => {
            test('applies custom expressButtonLayout', () => {
                const theme = buildTheme({expressButtonLayout: 'horizontal'})

                expect(theme.expressButtons.buttonLayout).toBe('horizontal')
                // Other properties should remain default
                expect(theme.expressButtons.buttonShape).toBe('pill')
                expect(theme.expressButtons.buttonHeight).toBe(44)
            })

            test('applies custom expressButtonLabels', () => {
                const customLabels = {
                    applepay: 'buy',
                    googlepay: 'checkout',
                    paypal: 'checkout',
                    venmo: 'checkout'
                }
                const theme = buildTheme({expressButtonLabels: customLabels})

                expect(theme.expressButtons.buttonLabels).toEqual(customLabels)
                // Layout should remain default
                expect(theme.expressButtons.buttonLayout).toBe('vertical')
            })

            test('applies both custom options together', () => {
                const customLabels = {
                    applepay: 'buy',
                    googlepay: 'buy',
                    paypal: 'buy',
                    venmo: 'buy'
                }
                const theme = buildTheme({
                    expressButtonLayout: 'horizontal',
                    expressButtonLabels: customLabels
                })

                expect(theme.expressButtons.buttonLayout).toBe('horizontal')
                expect(theme.expressButtons.buttonLabels).toEqual(customLabels)
            })

            test('handles partial expressButtonLabels override', () => {
                const partialLabels = {
                    applepay: 'buy',
                    googlepay: 'checkout'
                }
                const theme = buildTheme({expressButtonLabels: partialLabels})

                expect(theme.expressButtons.buttonLabels).toEqual(partialLabels)
            })

            test('handles empty options object', () => {
                const theme = buildTheme({})

                expect(theme.expressButtons.buttonLayout).toBe('vertical')
                expect(theme.expressButtons.buttonLabels).toEqual({
                    applepay: 'plain',
                    googlepay: 'plain',
                    paypal: 'paypal',
                    venmo: 'paypal'
                })
            })

            test('handles null options', () => {
                const theme = buildTheme(null)

                expect(theme.expressButtons.buttonLayout).toBe('vertical')
                expect(theme.expressButtons.buttonLabels).toEqual({
                    applepay: 'plain',
                    googlepay: 'plain',
                    paypal: 'paypal',
                    venmo: 'paypal'
                })
            })

            test('handles undefined options', () => {
                const theme = buildTheme(undefined)

                expect(theme.expressButtons.buttonLayout).toBe('vertical')
                expect(theme.expressButtons.buttonLabels).toEqual({
                    applepay: 'plain',
                    googlepay: 'plain',
                    paypal: 'paypal',
                    venmo: 'paypal'
                })
            })
        })

        describe('theme immutability', () => {
            test('multiple calls return independent objects', () => {
                const theme1 = buildTheme()
                const theme2 = buildTheme()

                expect(theme1).toEqual(theme2)
                expect(theme1).not.toBe(theme2)
                expect(theme1.designTokens).not.toBe(theme2.designTokens)
                expect(theme1.rules).not.toBe(theme2.rules)
                expect(theme1.expressButtons).not.toBe(theme2.expressButtons)
            })

            test('different options create different themes', () => {
                const theme1 = buildTheme({expressButtonLayout: 'horizontal'})
                const theme2 = buildTheme({expressButtonLayout: 'vertical'})

                expect(theme1.expressButtons.buttonLayout).toBe('horizontal')
                expect(theme2.expressButtons.buttonLayout).toBe('vertical')
            })
        })

        describe('express button specific configurations', () => {
            test('buttonColors are always static', () => {
                const theme = buildTheme({customColors: 'ignored'})

                expect(theme.expressButtons.buttonColors).toEqual({
                    applepay: 'black',
                    googlepay: 'black',
                    paypal: 'gold',
                    venmo: 'blue'
                })
            })

            test('buttonShape is always pill', () => {
                const theme = buildTheme()

                expect(theme.expressButtons.buttonShape).toBe('pill')
            })

            test('buttonHeight is always 44', () => {
                const theme = buildTheme()

                expect(theme.expressButtons.buttonHeight).toBe(44)
            })

            test('supports all valid layout options', () => {
                const horizontalTheme = buildTheme({expressButtonLayout: 'horizontal'})
                const verticalTheme = buildTheme({expressButtonLayout: 'vertical'})

                expect(horizontalTheme.expressButtons.buttonLayout).toBe('horizontal')
                expect(verticalTheme.expressButtons.buttonLayout).toBe('vertical')
            })

            test('supports all button label types', () => {
                const labels = {
                    applepay: 'custom-label',
                    googlepay: 'another-label',
                    paypal: 'paypal-label',
                    venmo: 'venmo-label'
                }
                const theme = buildTheme({expressButtonLabels: labels})

                expect(theme.expressButtons.buttonLabels).toEqual(labels)
            })
        })

        describe('design token properties', () => {
            test('font-family uses system font stack', () => {
                const theme = buildTheme()

                expect(theme.designTokens['font-family']).toContain('-apple-system')
                expect(theme.designTokens['font-family']).toContain('system-ui')
            })

            test('color tokens are valid hex values', () => {
                const theme = buildTheme()

                expect(theme.designTokens['color-text-default']).toMatch(/^#[0-9a-f]{6}$/i)
                expect(theme.designTokens['color-text-error']).toMatch(/^#[0-9a-f]{6}$/i)
                expect(theme.designTokens['color-brand']).toMatch(/^#[0-9a-f]{6}$/i)
            })

            test('spacing tokens use pixel units', () => {
                const theme = buildTheme()

                expect(theme.designTokens['spacing-small']).toMatch(/^\d+px$/)
                expect(theme.designTokens['spacing-medium']).toMatch(/^\d+px$/)
                expect(theme.designTokens['spacing-large']).toMatch(/^\d+px$/)
            })

            test('border-radius tokens use pixel units', () => {
                const theme = buildTheme()

                expect(theme.designTokens['border-radius-small']).toMatch(/^\d+px$/)
                expect(theme.designTokens['border-radius-medium']).toMatch(/^\d+px$/)
            })
        })

        describe('rules configuration', () => {
            test('input rules include focus state', () => {
                const theme = buildTheme()

                expect(theme.rules.input.focus).toBeDefined()
                expect(theme.rules.input.focus.border).toContain('#1b96ff')
                expect(theme.rules.input.focus['box-shadow']).toContain('#1b96ff')
            })

            test('input rules include invalid state', () => {
                const theme = buildTheme()

                expect(theme.rules.input.invalid).toBeDefined()
                expect(theme.rules.input.invalid.border).toContain('#ea001e')
                expect(theme.rules.input.invalid['box-shadow']).toContain('#ea001e')
            })

            test('button rules include border-radius', () => {
                const theme = buildTheme()

                expect(theme.rules.button['border-radius']).toBe('4px')
            })

            test('formLabel rules include typography settings', () => {
                const theme = buildTheme()

                expect(theme.rules.formLabel['font-size']).toBe('14px')
                expect(theme.rules.formLabel['font-weight']).toBe('600')
            })

            test('error rules use error color', () => {
                const theme = buildTheme()

                expect(theme.rules.error.color).toBe('#ea001e')
            })
        })
    })

    describe('transformAddressDetails', () => {
        test('transforms complete addresses with full names', () => {
            const billingDetails = {
                name: 'John Michael Doe',
                phone: '+1234567890',
                address: {
                    line1: '123 Main St',
                    line2: 'Apt 4B',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94102',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Smith',
                phone: '+0987654321',
                address: {
                    line1: '456 Shipping Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.billingAddress).toEqual({
                firstName: 'John Michael',
                lastName: 'Doe',
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'San Francisco',
                stateCode: 'CA',
                postalCode: '94102',
                countryCode: 'US',
                phone: '+1234567890'
            })
            expect(result.shippingAddress).toEqual({
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '456 Shipping Ave',
                address2: null,
                city: 'Los Angeles',
                stateCode: 'CA',
                postalCode: '90001',
                countryCode: 'US',
                phone: '+0987654321'
            })
        })

        test('handles single word name in billing address', () => {
            const billingDetails = {
                name: 'Madonna',
                address: {
                    line1: '456 Oak Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Smith',
                address: {
                    line1: '789 Elm St',
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.billingAddress.firstName).toBe('')
            expect(result.billingAddress.lastName).toBe('Madonna')
        })

        test('handles missing name in shipping address', () => {
            const billingDetails = {
                name: 'John Doe',
                address: {
                    line1: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94102',
                    country: 'US'
                }
            }

            const shippingDetails = {
                address: {
                    line1: '321 Pine St',
                    city: 'Boston',
                    state: 'MA',
                    postalCode: '02101',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.shippingAddress.firstName).toBeNull()
            expect(result.shippingAddress.lastName).toBeNull()
        })

        test('handles missing line2', () => {
            const billingDetails = {
                name: 'Bob Johnson',
                address: {
                    line1: '555 Broadway',
                    city: 'Seattle',
                    state: 'WA',
                    postalCode: '98101',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Doe',
                address: {
                    line1: '123 Main St',
                    city: 'Seattle',
                    state: 'WA',
                    postalCode: '98101',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.billingAddress.address2).toBeNull()
            expect(result.billingAddress.address1).toBe('555 Broadway')
        })

        test('handles missing phone', () => {
            const billingDetails = {
                name: 'Alice Cooper',
                address: {
                    line1: '777 Rock Blvd',
                    city: 'Detroit',
                    state: 'MI',
                    postalCode: '48201',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Doe',
                address: {
                    line1: '123 Main St',
                    city: 'Detroit',
                    state: 'MI',
                    postalCode: '48201',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.billingAddress.phone).toBeNull()
        })

        test('handles international address', () => {
            const billingDetails = {
                name: 'Pierre Dubois',
                phone: '+33123456789',
                address: {
                    line1: '10 Rue de la Paix',
                    line2: 'Appartement 5',
                    city: 'Paris',
                    state: 'IDF',
                    postalCode: '75001',
                    country: 'FR'
                }
            }

            const shippingDetails = {
                name: 'Marie Curie',
                address: {
                    line1: '5 Rue de Lyon',
                    city: 'Paris',
                    state: 'IDF',
                    postalCode: '75001',
                    country: 'FR'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result.billingAddress.countryCode).toBe('FR')
            expect(result.billingAddress.firstName).toBe('Pierre')
            expect(result.billingAddress.lastName).toBe('Dubois')
        })

        test('uses shipping as billing when billing details are incomplete (PayPal case)', () => {
            const billingDetails = {
                // Missing name and city - incomplete
                address: {
                    line1: '123 Billing St',
                    state: 'CA',
                    postalCode: '94102',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Smith',
                phone: '+0987654321',
                address: {
                    line1: '456 Shipping Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            expect(result).toHaveProperty('billingAddress')
            expect(result).toHaveProperty('shippingAddress')
            // Billing address should use shipping details
            expect(result.billingAddress).toEqual({
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '456 Shipping Ave',
                address2: null,
                city: 'Los Angeles',
                stateCode: 'CA',
                postalCode: '90001',
                countryCode: 'US',
                phone: '+0987654321'
            })
            expect(result.shippingAddress).toEqual({
                firstName: 'Jane',
                lastName: 'Smith',
                address1: '456 Shipping Ave',
                address2: null,
                city: 'Los Angeles',
                stateCode: 'CA',
                postalCode: '90001',
                countryCode: 'US',
                phone: '+0987654321'
            })
        })

        test('uses shipping as billing when billing details missing name', () => {
            const billingDetails = {
                // Missing name - incomplete
                address: {
                    line1: '123 Billing St',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94102',
                    country: 'US'
                }
            }

            const shippingDetails = {
                name: 'Jane Smith',
                phone: '+0987654321',
                address: {
                    line1: '456 Shipping Ave',
                    city: 'Los Angeles',
                    state: 'CA',
                    postalCode: '90001',
                    country: 'US'
                }
            }

            const result = transformAddressDetails(billingDetails, shippingDetails)

            // Should use shipping for billing since name is missing
            expect(result.billingAddress.firstName).toBe('Jane')
            expect(result.billingAddress.lastName).toBe('Smith')
            expect(result.billingAddress.city).toBe('Los Angeles')
        })
    })

    describe('transformShippingMethods', () => {
        const basket = {
            currency: 'USD'
        }

        test('transforms shipping methods with numeric price', () => {
            const shippingMethods = [
                {
                    id: 'standard',
                    name: 'Standard Shipping',
                    description: 'Delivery in 5-7 business days',
                    price: 5.99
                },
                {
                    id: 'express',
                    name: 'Express Shipping',
                    description: 'Delivery in 2-3 business days',
                    price: 15.99
                }
            ]

            const result = transformShippingMethods(shippingMethods, basket)

            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                id: 'standard',
                name: 'Standard Shipping',
                classOfService: 'Delivery in 5-7 business days',
                shippingFee: '5.99',
                currencyIsoCode: 'USD'
            })
            expect(result[1].shippingFee).toBe('15.99')
        })

        test('transforms shipping methods with string price', () => {
            const shippingMethods = [
                {
                    id: 'free',
                    name: 'Free Shipping',
                    description: 'Delivery in 7-10 business days',
                    price: '0.00'
                }
            ]

            const result = transformShippingMethods(shippingMethods, basket)

            expect(result[0].shippingFee).toBe('0.00')
        })

        test('sorts selected method to top when sortSelected is true', () => {
            const shippingMethods = [
                {id: 'standard', name: 'Standard', description: 'Standard', price: 5.99},
                {id: 'express', name: 'Express', description: 'Express', price: 15.99},
                {id: 'overnight', name: 'Overnight', description: 'Overnight', price: 25.99}
            ]

            const result = transformShippingMethods(shippingMethods, basket, 'express', true)

            expect(result[0].id).toBe('express')
            expect(result[1].id).toBe('standard')
            expect(result[2].id).toBe('overnight')
        })

        test('does not sort when sortSelected is false', () => {
            const shippingMethods = [
                {id: 'standard', name: 'Standard', description: 'Standard', price: 5.99},
                {id: 'express', name: 'Express', description: 'Express', price: 15.99},
                {id: 'overnight', name: 'Overnight', description: 'Overnight', price: 25.99}
            ]

            const result = transformShippingMethods(shippingMethods, basket, 'express', false)

            expect(result[0].id).toBe('standard')
            expect(result[1].id).toBe('express')
            expect(result[2].id).toBe('overnight')
        })

        test('handles no selected ID', () => {
            const shippingMethods = [
                {id: 'standard', name: 'Standard', description: 'Standard', price: 5.99}
            ]

            const result = transformShippingMethods(shippingMethods, basket, null, true)

            expect(result[0].id).toBe('standard')
        })

        test('uses basket currency for all methods', () => {
            const eurBasket = {currency: 'EUR'}
            const shippingMethods = [
                {id: 'method1', name: 'Method 1', description: 'Desc 1', price: 10},
                {id: 'method2', name: 'Method 2', description: 'Desc 2', price: 20}
            ]

            const result = transformShippingMethods(shippingMethods, eurBasket)

            expect(result[0].currencyIsoCode).toBe('EUR')
            expect(result[1].currencyIsoCode).toBe('EUR')
        })
    })

    describe('getSelectedShippingMethodId', () => {
        test('returns shipping method ID from basket shipment', () => {
            const basket = {
                shipments: [
                    {
                        shippingMethod: {
                            id: 'express-shipping'
                        }
                    }
                ]
            }
            const shippingMethods = {
                defaultShippingMethodId: 'standard-shipping'
            }

            const result = getSelectedShippingMethodId(basket, shippingMethods)

            expect(result).toBe('express-shipping')
        })

        test('returns default when basket has no shipments', () => {
            const basket = {}
            const shippingMethods = {
                defaultShippingMethodId: 'standard-shipping'
            }

            const result = getSelectedShippingMethodId(basket, shippingMethods)

            expect(result).toBe('standard-shipping')
        })

        test('returns default when basket has empty shipments array', () => {
            const basket = {
                shipments: []
            }
            const shippingMethods = {
                defaultShippingMethodId: 'standard-shipping'
            }

            const result = getSelectedShippingMethodId(basket, shippingMethods)

            expect(result).toBe('standard-shipping')
        })

        test('returns default when shipping method is null', () => {
            const basket = {
                shipments: [
                    {
                        shippingMethod: null
                    }
                ]
            }
            const shippingMethods = {
                defaultShippingMethodId: 'standard-shipping'
            }

            const result = getSelectedShippingMethodId(basket, shippingMethods)

            expect(result).toBe('standard-shipping')
        })

        test('returns default when shipping method ID is undefined', () => {
            const basket = {
                shipments: [
                    {
                        shippingMethod: {}
                    }
                ]
            }
            const shippingMethods = {
                defaultShippingMethodId: 'overnight-shipping'
            }

            const result = getSelectedShippingMethodId(basket, shippingMethods)

            expect(result).toBe('overnight-shipping')
        })
    })

    describe('isShippingMethodValid', () => {
        test('returns true when current shipping method is in applicable methods', () => {
            const currentBasket = {
                shipments: [
                    {
                        shippingMethod: {
                            id: 'express'
                        }
                    }
                ]
            }
            const updatedShippingMethods = {
                applicableShippingMethods: [{id: 'standard'}, {id: 'express'}, {id: 'overnight'}]
            }

            const result = isShippingMethodValid(currentBasket, updatedShippingMethods)

            expect(result).toBe(true)
        })

        test('returns false when current shipping method is not in applicable methods', () => {
            const currentBasket = {
                shipments: [
                    {
                        shippingMethod: {
                            id: 'international'
                        }
                    }
                ]
            }
            const updatedShippingMethods = {
                applicableShippingMethods: [{id: 'standard'}, {id: 'express'}]
            }

            const result = isShippingMethodValid(currentBasket, updatedShippingMethods)

            expect(result).toBe(false)
        })

        test('returns false when current shipping method is undefined', () => {
            const currentBasket = {
                shipments: [
                    {
                        shippingMethod: {}
                    }
                ]
            }
            const updatedShippingMethods = {
                applicableShippingMethods: [{id: 'standard'}]
            }

            const result = isShippingMethodValid(currentBasket, updatedShippingMethods)

            expect(result).toBe(false)
        })

        test('returns false when applicable methods is empty', () => {
            const currentBasket = {
                shipments: [
                    {
                        shippingMethod: {
                            id: 'express'
                        }
                    }
                ]
            }
            const updatedShippingMethods = {
                applicableShippingMethods: []
            }

            const result = isShippingMethodValid(currentBasket, updatedShippingMethods)

            expect(result).toBe(false)
        })
    })

    describe('isPayPalPaymentMethodType', () => {
        test('returns true for paypal payment method type', () => {
            const result = isPayPalPaymentMethodType('paypal')

            expect(result).toBe(true)
        })

        test('returns true for venmo payment method type', () => {
            const result = isPayPalPaymentMethodType('venmo')

            expect(result).toBe(true)
        })

        test('returns false for card payment method type', () => {
            const result = isPayPalPaymentMethodType('card')

            expect(result).toBe(false)
        })
    })

    describe('createPaymentInstrumentBody', () => {
        test('creates payment instrument body with all parameters', () => {
            const result = createPaymentInstrumentBody(99.99, 'card', 'us-west-1')

            expect(result).toEqual({
                paymentMethodId: 'Salesforce Payments',
                amount: 99.99,
                paymentReferenceRequest: {
                    paymentMethodType: 'card',
                    zoneId: 'us-west-1'
                }
            })
        })

        test('uses default zoneId when not provided', () => {
            const result = createPaymentInstrumentBody(50.0, 'paypal', null)

            expect(result.paymentReferenceRequest.zoneId).toBe('default')
        })

        test('uses default zoneId when undefined', () => {
            const result = createPaymentInstrumentBody(75.5, 'venmo', undefined)

            expect(result.paymentReferenceRequest.zoneId).toBe('default')
        })

        test('creates body for PayPal payment', () => {
            const result = createPaymentInstrumentBody(125.0, 'paypal', 'eu-west-1')

            expect(result.paymentMethodId).toBe('Salesforce Payments')
            expect(result.paymentReferenceRequest.paymentMethodType).toBe('paypal')
            expect(result.amount).toBe(125.0)
        })

        test('creates body for Venmo payment', () => {
            const result = createPaymentInstrumentBody(45.99, 'venmo', 'us-east-1')

            expect(result.paymentReferenceRequest.paymentMethodType).toBe('venmo')
        })

        test('creates body for card payment', () => {
            const result = createPaymentInstrumentBody(199.99, 'card', 'ap-southeast-1')

            expect(result.paymentReferenceRequest.paymentMethodType).toBe('card')
        })

        test('handles decimal amounts', () => {
            const result = createPaymentInstrumentBody(12.34, 'card', 'default')

            expect(result.amount).toBe(12.34)
        })

        test('handles zero amount', () => {
            const result = createPaymentInstrumentBody(0, 'card', 'default')

            expect(result.amount).toBe(0)
        })

        test('includes shippingPreference when provided', () => {
            const result = createPaymentInstrumentBody(
                100.0,
                'paypal',
                'us-west-1',
                'GET_FROM_FILE'
            )

            expect(result.paymentReferenceRequest.shippingPreference).toBe('GET_FROM_FILE')
        })
    })
})
