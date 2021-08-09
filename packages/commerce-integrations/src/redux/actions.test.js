/**
 * Demonstrates testing the redux action layer of the IM.
 *
 * Note that these are *not* integration tests - the API
 * layer is fully-mocked and injected into the thunk-actions.
 */
import stringify from 'json-stable-stringify'
import thunk from 'redux-thunk'
import sinon from 'sinon'
import * as actions from './actions'
import * as interfaces from '../connectors/interfaces'
import reducerConf from './reducers'
import {createStore, applyMiddleware, combineReducers} from 'redux'

const reducer = combineReducers({...reducerConf})

const setupMocks = () => {
    const mockApi = sinon.createStubInstance(interfaces.CommerceConnector)
    const store = createStore(reducer, applyMiddleware(thunk.withExtraArgument({api: mockApi})))
    return {mockApi, store}
}

describe('Redux actions', () => {
    it.only('SearchProducts should request products and merge them into the store', () => {
        const {mockApi, store} = setupMocks()

        const result = {products: [{title: 'A product'}]}
        mockApi.searchProducts.returns(Promise.resolve(result))

        const searchParams = {categoryId: '10'}
        const resultKey = stringify(searchParams)

        return store.dispatch(actions.searchProducts(searchParams)).then(() => {
            const {productSearches} = store.getState()
            expect(productSearches.toJS()).toEqual({[resultKey]: result})
        })
    })
})
