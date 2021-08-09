import {PhoneNumber} from './index'
import {propTypeErrors} from '../utils/test-utils'

describe('Phone Number Tests', () => {
    const model = {
        phone: PhoneNumber
    }

    test('Minumum length is 2', () => {
        expect(propTypeErrors(model, {phone: '+12'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '12'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '+1'})).toBeTruthy()
        expect(propTypeErrors(model, {phone: '1'})).toBeTruthy()
        expect(propTypeErrors(model, {phone: ''})).toBeTruthy()
    })
    test('Maximum length is 15', () => {
        expect(propTypeErrors(model, {phone: '+1234567890'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '1234567890'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '+123456789012345'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '123456789012345'})).toBeFalsy()
        expect(propTypeErrors(model, {phone: '+1234567890123456'})).toBeTruthy()
        expect(propTypeErrors(model, {phone: '1234567890123456'})).toBeTruthy()
    })
})
