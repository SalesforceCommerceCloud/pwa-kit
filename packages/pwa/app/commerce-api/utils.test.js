import jwt from 'njwt'
import {camelCaseKeysToUnderscore, isTokenValid} from './utils'

const createJwt = (secondsToExp) => {
    const token = jwt.create({}, 'test')
    token.setExpiration(new Date().getTime() + secondsToExp * 1000)
    return token.compact()
}

describe('isTokenValid', () => {
    test('returns false when no token given', () => {
        expect(isTokenValid()).toBe(false)
    })

    test('returns true for valid token', () => {
        const token = createJwt(600)
        const bearerToken = `Bearer ${token}`
        expect(isTokenValid(token)).toBe(true)
        expect(isTokenValid(bearerToken)).toBe(true)
    })

    test('returns false if token expires within 60 econds', () => {
        expect(isTokenValid(createJwt(59))).toBe(false)
    })

    test('camelCaseToUnderScore returns a copy of the object with renamed keys (deep/recursvive)', () => {
        const camelCaseObject = {
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        }
        const underScoreKeys = camelCaseKeysToUnderscore(camelCaseObject)

        expect(camelCaseObject).toStrictEqual({
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        })
        expect(underScoreKeys.test_key).toBeDefined()
        expect(underScoreKeys.test_key.nested_test_key).toBeDefined()
        expect(underScoreKeys.test_key.nested_test_key.deep_down_key).toBeDefined()
    })
})
