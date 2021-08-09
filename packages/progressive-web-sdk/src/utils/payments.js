// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// const PATTERN_4_4_5 = [4, 4, 5] // 13
// const PATTERN_4_6_4 = [4, 6, 4] // 14
// const PATTERN_4_5_6 = [4, 5, 6] // 15
// const PATTERN_4_6_5 = [4, 6, 5] // 15
// const PATTERN_4_4_4_4 = [4, 4, 4, 4] // 16
// const PATTERN_6_13 = [6, 13] // 19
// const PATTERN_4_4_4_4_3 = [4, 4, 4, 4, 3] // 19
// const PATTERN_2_2 = [2, 2] // 4
// const PATTERN_3 = [3] // 3
// const PATTERN_4 = [4] // 4

// export const UATP = 'UATP'
// export const DINERS_CLUB = 'Diners Club'
// export const AMERICAN_EXPRESS = 'American Express'
// export const JCB = 'JCB'
// export const VISA = 'Visa'
// export const VISA_ELECTRON = 'Visa Electron'
// export const MAESTRO = 'Maestro'
// export const DANKORT = 'Dankort'
// export const MASTERCARD = 'MasterCard'
// export const CHINA_UNIONPAY = 'China UnionPay'
// export const INTERPAYMENT = 'InterPayment'
// export const DISCOVER = 'Discover'

// export const cvvDefault = {
//     default: PATTERN_3,
//     iconName: 'default-hint'
// }

// export const cvvAmex = {
//     default: PATTERN_4,
//     iconName: 'amex-hint'
// }

// export const expiryFormat = {
//     default: PATTERN_2_2
// }

// export let cardDataMap = {
//     [UATP]: {
//         // IIN Ranges: 1
//         match: '^1',
//         format: {
//             default: PATTERN_4_5_6
//         },
//         cvv: cvvDefault
//     },

//     [DINERS_CLUB]: {
//         // IIN Ranges: 300‑305, 309, 36, 38‑39
//         match: '^(30[0-5]|309|3[689])',
//         format: {
//             default: PATTERN_4_6_4
//         },
//         cvv: cvvDefault
//     },

//     [AMERICAN_EXPRESS]: {
//         // IIN Ranges: 34, 37
//         match: '^3[47]',
//         format: {
//             default: PATTERN_4_6_5
//         },
//         cvv: cvvAmex
//     },

//     [JCB]: {
//         // IIN Ranges: 3528‑3589
//         match: '^35(2[89]|[3-8][0-9])',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     },

//     [VISA]: {
//         // IIN Ranges: 4
//         match: '^(4)',
//         format: {
//             default: PATTERN_4_4_4_4_3
//         },
//         cvv: cvvDefault
//     },

//     [VISA_ELECTRON]: {
//         // IIN Ranges: 4026, 417500, 4405, 4508, 4844, 4913, 4917
//         match: '^(4026|417500|4405|4508|4844|491[37])',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     },

//     [MAESTRO]: {
//         // IIN Ranges: 500000‑509999, 560000-589999, 600000-699999
//         match: '^(50[0-9]{4}|56[0-9]{4}|(5[78]|6[0-9])[0-9]{4})',
//         format: {
//             default: PATTERN_4_4_4_4_3,
//             13: PATTERN_4_4_5,
//             15: PATTERN_4_6_5
//         },
//         cvv: cvvDefault
//     },

//     [DANKORT]: {
//         // IIN Ranges: 5019
//         match: '^5019',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     },

//     // 'Diners Club United States & Canada'
//     // MasterCard co-brand
//     [MASTERCARD]: {
//         // IIN Ranges: 51-55
//         match: '^5[1-5]',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     },

//     [CHINA_UNIONPAY]: {
//         // IIN Ranges: 62
//         match: '^62',
//         format: {
//             default: PATTERN_6_13,
//             16: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     },

//     [INTERPAYMENT]: {
//         // IIN Ranges: 636
//         match: '^636',
//         format: {
//             default: PATTERN_4_4_4_4_3
//         },
//         cvv: cvvDefault
//     },

//     [DISCOVER]: {
//         // IIN Ranges: 6011, 622126‑622925, 644‑649, 65
//         // Note: Range in 622126-622925 are dual-branded with UnionPay
//         match: '^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5])|64[4-9]|65)',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     }
// }

// // Checks if the two patterns (arrays of integer values) are equal
// // Eg. patternsEqual([2, 2], [2, 2]) === true
// //     patternsEqual([2, 3], [2, 2]) === false
// const patternsEqual = (patternA, patternB) => {
//     // Strict equality for fast exit
//     // Note: We don't want reference quality (===) here as the pattern is
//     //       passed in by the caller, yet the PATTERN_.. constants aren't
//     //       exported and so we aren't guaranteed to be getting the same
//     //       instance of the array.
//     //       Hack solution based on https://stackoverflow.com/a/14288329/11807
//     if (
//         patternA
//             .slice()
//             .sort()
//             .toString() ===
//         patternB
//             .slice()
//             .sort()
//             .toString()
//     ) {
//         // eslint-disable-line newline-per-chained-call
//         return true
//     }

//     // This condition is currently impossible to reach. Due to how
//     // `formatValuePattern` (the only place this is currently used) is written.
//     //
//     // if (!patternA || !patternB) {
//     //     return false
//     // }

//     return patternA.length === patternB.length && patternA.every((v, i) => v === patternB[i])
// }

// export const registerCardDataMap = (customCardDataMap) => {
//     cardDataMap = {...cardDataMap, ...customCardDataMap}
// }

// export const formatValue = (cardNumber) => {
//     return cardNumber ? cardNumber.replace(/[^0-9]/g, '') : ''
// }

// export const getCardData = (cardNumber) => {
//     const defaultCardData = {
//         cardType: '',
//         match: '',
//         format: {
//             default: PATTERN_4_4_4_4
//         },
//         cvv: cvvDefault
//     }

//     // Strip out any non-digits
//     // Eg: "4111 1111 1111 1111" -> "4111111111111111"
//     cardNumber = formatValue(cardNumber)

//     let matchedCardData

//     for (const key in cardDataMap) {
//         /* istanbul ignore else */
//         if (cardDataMap.hasOwnProperty(key)) {
//             const regex = new RegExp(cardDataMap[key].match)
//             const match = cardNumber.match(regex)

//             if (match) {
//                 matchedCardData = {
//                     cardType: key,
//                     ...cardDataMap[key]
//                 }
//             }
//         }
//     }

//     // If nothing matches our card data map return the default data
//     return matchedCardData || defaultCardData
// }

// export const formatValuePattern = (value, pattern = []) => {
//     let formattedValue = ''
//     let charChunkIndex = 0
//     let currentChunk = 0
//     let chunkCountFallback = 4
//     let chunkSpacer = ' '

//     if (!pattern) {
//         return ''
//     }

//     const maxNumberLength = pattern.reduce((sum, currentValue) => sum + currentValue, 0)

//     // Check for expiry date pattern
//     if (patternsEqual(PATTERN_2_2, pattern)) {
//         chunkCountFallback = 2
//         chunkSpacer = '/'
//     }

//     for (let i = 0; i < value.length && i < maxNumberLength; i++) {
//         // 4 is a failsafe in case pattern doesn't return any chunk values
//         /* istanbul ignore next */
//         const chunkCount = pattern[currentChunk] || chunkCountFallback

//         formattedValue += value.charAt(i)

//         // Keep track of value character index for next pattern chunk
//         charChunkIndex++

//         // This means we've reached the number count in this chunk
//         // so move onto the next chunk
//         if (charChunkIndex === chunkCount) {
//             // Add space between number chunks
//             formattedValue += chunkSpacer

//             // Iterate for next pattern chunk
//             currentChunk++

//             // Reset character count in chunk for next chunk
//             charChunkIndex = 0
//         }
//     }
//     // remove '/' and space from last pattern set interaction
//     return formattedValue.trim().replace(/\/$/, '')
// }

// /**
//  * Format a card number for display
//  *
//  * Eg. "4111111111111111" -> "4111 1111 1111 1111"
//  */
// export const toDisplayValue = (value, format) => {
//     // Remove any non-digit from numbers
//     value = formatValue(value)

//     // Get number length because certain credit card types have specific
//     // patterns for different number lengths
//     const valueCount = value.length
//     const formatPattern = format[valueCount] ? format[valueCount] : format.default

//     return formatValuePattern(value, formatPattern)
// }

// /**
//  * Format a card number for storage
//  *
//  * Eg. "4111 1111 1111 1111" -> "4111111111111111"
//  */
// export const toStoreValue = (value, format) => {
//     // Format number to pattern guideline before stripping out non-digits
//     // https://baymard.com/checkout-usability/credit-card-patterns
//     // https://en.wikipedia.org/wiki/Payment_card_number#Issuer_identification_number_.28IIN.29
//     // Eg. "4111 1111 1111 1111 1112" -> "4111111111111111111"
//     // 20 numbers will be formatted to 19 numbers for VISA as per pattern guideline
//     return value && formatValue(toDisplayValue(value, format))
// }

// /**
//  * Decorate a redux-form event handler to transform card
//  * numbers for storage
//  */
// export const toStoreValueDecorator = (fun, format) => (event) => {
//     fun(toStoreValue(event.target.value, format))
// }
