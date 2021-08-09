import {processRequest} from './request-processor'

describe('processRequest', () => {
    test('returns valid values', () => {
        const result = processRequest({path: 'path', querystring: 'querystring'})

        expect(result.path).toEqual(expect.any(String))
        expect(result.querystring).toEqual(expect.any(String))
    })
})
