import AppConfig from './index.jsx'
import {getConnector} from '../../connector'

describe('AppConfig', () => {
    test('AppConfig static methods behave as expected', () => {
        const connector = getConnector()
        expect(AppConfig.restore()).toBe(undefined)
        expect(AppConfig.restore({frozen: 'any values here'})).toBe(undefined)
        expect(AppConfig.freeze()).toBe(undefined)
        expect(AppConfig.extraGetPropsArgs()).toEqual({connector})
    })
})
