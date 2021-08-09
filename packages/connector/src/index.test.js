import Connector from './index.js'

describe(`The Connector`, () => {
    const makeConnector = () => Promise.resolve(new Connector({}))

    test('Creating a Connector', () => {
        return makeConnector().then((connector) => expect(connector).toBeDefined())
    })
})
