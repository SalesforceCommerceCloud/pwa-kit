/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import {
    UATP,
    DINERS_CLUB,
    AMERICAN_EXPRESS,
    JCB,
    VISA,
    VISA_ELECTRON,
    MAESTRO,
    DANKORT,
    MASTERCARD,
    CHINA_UNIONPAY,
    INTERPAYMENT,
    DISCOVER
} from '../../card-utils'

import CardInput from './index.jsx'
import Icon from '../icon'

const visaTestNum = '4111411141114111'
const displayVisaTestNum = '4111 4111 4111 4111'

const testCardNumbers = {
    348282246310005: {
        cardType: AMERICAN_EXPRESS,
        displayNum: '3482 822463 10005'
    },
    371449635398431: {
        cardType: AMERICAN_EXPRESS,
        displayNum: '3714 496353 98431'
    },
    6250941006528599: {
        cardType: CHINA_UNIONPAY,
        displayNum: '6250 9410 0652 8599'
    },
    6250941006528599000: {
        cardType: CHINA_UNIONPAY,
        displayNum: '625094 1006528599000'
    },
    5019555544445555: {
        cardType: DANKORT,
        displayNum: '5019 5555 4444 5555'
    },
    30569309025904: {
        cardType: DINERS_CLUB,
        displayNum: '3056 930902 5904'
    },
    38520000023237: {
        cardType: DINERS_CLUB,
        displayNum: '3852 000002 3237'
    },
    36006666333344: {
        cardType: DINERS_CLUB,
        displayNum: '3600 666633 3344'
    },
    6011111111111117: {
        cardType: DISCOVER,
        displayNum: '6011 1111 1111 1117'
    },
    6011000990139424: {
        cardType: DISCOVER,
        displayNum: '6011 0009 9013 9424'
    },
    6361930180238108: {
        cardType: INTERPAYMENT,
        displayNum: '6361 9301 8023 8108'
    },
    6361209810924819000: {
        cardType: INTERPAYMENT,
        displayNum: '6361 2098 1092 4819 000'
    },
    3530111333300000: {
        cardType: JCB,
        displayNum: '3530 1113 3330 0000'
    },
    3566002020360505: {
        cardType: JCB,
        displayNum: '3566 0020 2036 0505'
    },
    3569990010095841: {
        cardType: JCB,
        displayNum: '3569 9900 1009 5841'
    },
    5000000000000: {
        cardType: MAESTRO,
        displayNum: '5000 0000 00000'
    },
    673101234567890: {
        cardType: MAESTRO,
        displayNum: '6731 012345 67890'
    },
    6799990100000000000: {
        cardType: MAESTRO,
        displayNum: '6799 9901 0000 0000 000'
    },
    5105105105105100: {
        cardType: MASTERCARD,
        displayNum: '5105 1051 0510 5100'
    },
    5255555555554444: {
        cardType: MASTERCARD,
        displayNum: '5255 5555 5555 4444'
    },
    5312938129031001: {
        cardType: MASTERCARD,
        displayNum: '5312 9381 2903 1001'
    },
    5455555123154444: {
        cardType: MASTERCARD,
        displayNum: '5455 5551 2315 4444'
    },
    5585558555855583: {
        cardType: MASTERCARD,
        displayNum: '5585 5585 5585 5583'
    },
    135410014004955: {
        cardType: UATP,
        displayNum: '1354 10014 004955'
    },
    4111111111111111000: {
        cardType: VISA,
        displayNum: '4111 1111 1111 1111 000'
    },
    4012888888881881: {
        cardType: VISA,
        displayNum: '4012 8888 8888 1881'
    },
    4222222222222: {
        cardType: VISA,
        displayNum: '4222 2222 2222 2'
    },
    4026300800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4026 3008 0000 0000'
    },
    4175000800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4175 0008 0000 0000'
    },
    4405000800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4405 0008 0000 0000'
    },
    4508000800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4508 0008 0000 0000'
    },
    4844000800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4844 0008 0000 0000'
    },
    4913300800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4913 3008 0000 0000'
    },
    4917300800000000: {
        cardType: VISA_ELECTRON,
        displayNum: '4917 3008 0000 0000'
    }
}

test('CardInput renders without errors', () => {
    const ccValue = '4111111111111111'
    const wrapper = mount(<CardInput value={ccValue} />)
    expect(wrapper.length).toBe(1)
    expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe(VISA)
})

test('CardInput does not display invalid card information', () => {
    const wrapper = mount(<CardInput value="not-a-card-number" />)

    expect(wrapper.prop('value')).toBe('not-a-card-number')
    expect(wrapper.find(Icon).prop('title')).toBe('')
})

test('CardInput displays the formatted number and type for a valid card', () => {
    const wrapper = mount(<CardInput value="" />)

    for (const key in testCardNumbers) {
        if (testCardNumbers.hasOwnProperty(key)) {
            const cardNumber = key
            const cardData = testCardNumbers[cardNumber]
            const cardType = cardData.cardType
            const displayNum = cardData.displayNum.replace(/\s/g, '')

            wrapper.setProps({value: cardNumber})

            expect(wrapper.prop('value')).toBe(displayNum)

            expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe(cardType)
        }
    }
})

test('CardInput calls change and blur callbacks with un-formatted data', () => {
    const onChange = jest.fn()
    const onBlur = jest.fn()
    const ccValue = '4111111111111111'
    const wrapper = mount(<CardInput value={ccValue} onChange={onChange} onBlur={onBlur} />)
    const input = wrapper.find('input').first()

    input.simulate('change', {target: {value: displayVisaTestNum}})

    expect(onChange).toBeCalledWith(visaTestNum)

    input.simulate('blur', {target: {value: displayVisaTestNum}})

    expect(onBlur).toBeCalledWith(visaTestNum)
})

test('CardInput displays the right cc type', () => {
    const ccType = 'MASTERCARD'
    const ccValue = '4111111111111111'
    const wrapper = mount(<CardInput value={ccValue} ccType={ccType} />)
    expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe(ccType)
})

test('Renders ccType if both ccType and CC# is provided ', () => {
    const ccType = 'MASTERCARD'
    const ccValue = '4111111111111111'
    const wrapper = mount(<CardInput value={ccValue} ccType={ccType} />)
    expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe(ccType)
    expect(wrapper.prop('value')).toBe(ccValue)
})

describe('Card Format Check', () => {
    const customCards = {
        'Custom Card 1': {
            match: '^633',
            format: {
                default: [4, 4, 4, 4]
            },
            cvv: {
                default: [3],
                iconName: 'default-hint'
            }
        },
        'Custom Card 2': {
            match: '^566',
            format: {
                default: [4, 10, 4]
            },
            cvv: {
                default: [3],
                iconName: 'default-hint'
            }
        }
    }

    // Add custom cards to getCardData
    CardInput.registerCustomFormat(customCards)

    test('Check for CardInput.registerCustomFormat function to be working', () => {
        // decalre setup things in here, run the tests below
        const ccValue = '6335864917026678'

        const wrapper = mount(<CardInput value={ccValue} />)
        expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe('Custom Card 1')
    })

    test('CardInput displays the formatted number and type for a valid card', () => {
        const wrapper = mount(<CardInput value="" />)

        for (const key in testCardNumbers) {
            if (testCardNumbers.hasOwnProperty(key)) {
                const cardNumber = key
                const cardData = testCardNumbers[cardNumber]
                const cardType = cardData.cardType
                const displayNum = cardData.displayNum.replace(/\s/g, '')

                wrapper.setProps({value: cardNumber})

                expect(wrapper.prop('value')).toBe(displayNum)

                expect(wrapper.find('svg.pw-card-input__card-icon').text()).toBe(cardType)
            }
        }
    })
})
