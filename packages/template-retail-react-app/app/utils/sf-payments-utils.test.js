/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {buildTheme} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'

describe('sf-payments-utils', () => {
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
})
