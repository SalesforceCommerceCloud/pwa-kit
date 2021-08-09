import {Longitude} from './index'
import {propTypeErrors} from '../utils/test-utils'

describe('Longitude Tests', () => {
    const model = {
        longitude: Longitude
    }

    test('Longitude is a number that can have a decimal, be negative or positive', () => {
        expect(propTypeErrors(model, {longitude: 50.3})).toBeFalsy()
        expect(propTypeErrors(model, {longitude: 30})).toBeFalsy()
        expect(propTypeErrors(model, {longitude: -24.0})).toBeFalsy()
        expect(propTypeErrors(model, {longitude: '50.30'})).toBeTruthy()
        expect(propTypeErrors(model, {longitude: '30'})).toBeTruthy()
        expect(propTypeErrors(model, {longitude: '-24.00'})).toBeTruthy()
    })
    test('Maximum Longitude is 180.00', () => {
        expect(propTypeErrors(model, {longitude: 180.0})).toBeFalsy()
        expect(propTypeErrors(model, {longitude: 180.01})).toBeTruthy()
        expect(propTypeErrors(model, {longitude: 181.0})).toBeTruthy()
    })
    test('Minimum Longitude is -180.00', () => {
        expect(propTypeErrors(model, {longitude: -180.0})).toBeFalsy()
        expect(propTypeErrors(model, {longitude: -180.01})).toBeTruthy()
        expect(propTypeErrors(model, {longitude: -181.0})).toBeTruthy()
    })
})
