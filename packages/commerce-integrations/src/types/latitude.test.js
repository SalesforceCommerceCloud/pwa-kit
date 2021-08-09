import {Latitude} from './index'
import {propTypeErrors} from '../utils/test-utils'

describe('Latitude Tests', () => {
    const model = {
        latitude: Latitude
    }

    test('Latitude is a number that can have a decimal, be negative or positive', () => {
        expect(propTypeErrors(model, {latitude: 50.3})).toBeFalsy()
        expect(propTypeErrors(model, {latitude: 30})).toBeFalsy()
        expect(propTypeErrors(model, {latitude: -24.0})).toBeFalsy()
        expect(propTypeErrors(model, {latitude: '50.30'})).toBeTruthy()
        expect(propTypeErrors(model, {latitude: '30'})).toBeTruthy()
        expect(propTypeErrors(model, {latitude: '-24.00'})).toBeTruthy()
    })
    test('Maximum Latitude is 90.00', () => {
        expect(propTypeErrors(model, {latitude: 90.0})).toBeFalsy()
        expect(propTypeErrors(model, {latitude: 90.01})).toBeTruthy()
        expect(propTypeErrors(model, {latitude: 91.0})).toBeTruthy()
    })
    test('Minimum Latitude is -90.00', () => {
        expect(propTypeErrors(model, {latitude: -90.0})).toBeFalsy()
        expect(propTypeErrors(model, {latitude: -90.01})).toBeTruthy()
        expect(propTypeErrors(model, {latitude: -91.0})).toBeTruthy()
    })
})
