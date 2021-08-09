import routes from './routes'

describe('Routes', () => {
    test('exports a valid react-router configuration', () => {
        expect(Array.isArray(routes)).toBe(true)
    })
})
