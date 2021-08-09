import * as actions from './actions'
import reducer from './reducer'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import stringify from 'json-stable-stringify'

test('onOnlineStatusChange updates the online status in the redux store', () => {
    const now = 1234
    expect(actions.onOnlineStatusChange(true, now)).toEqual({
        type: actions.ONLINE_STATUS_CHANGED,
        payload: {
            startTime: null
        }
    })
    expect(actions.onOnlineStatusChange(false, now)).toEqual({
        type: actions.ONLINE_STATUS_CHANGED,
        payload: {
            startTime: now
        }
    })
})

describe('getCategory uses a connector to get a category', () => {
    test('with a non-nested category result', () => {
        const cat = {id: '1234', name: 'Shoes'}
        class MockConnector {
            getCategory() {
                return Promise.resolve(cat)
            }
        }
        const storeFactory = configureStore([
            thunk.withExtraArgument({connector: new MockConnector()})
        ])
        const initial = reducer(undefined, {type: '!!unknown'})
        const store = storeFactory(initial)
        return store.dispatch(actions.getCategory(cat.id)).then(() => {
            expect(store.getActions()).toEqual([actions.categoriesReceived({[cat.id]: cat})])
        })
    })

    test('with a nested category result', () => {
        const cat = {id: '1234', name: 'Shoes', categories: [{id: '5678', name: 'Youth Shoes'}]}
        class MockConnector {
            getCategory() {
                return Promise.resolve(cat)
            }
        }
        const storeFactory = configureStore([
            thunk.withExtraArgument({connector: new MockConnector()})
        ])
        const initial = reducer(undefined, {type: '!!unknown'})
        const store = storeFactory(initial)
        return store.dispatch(actions.getCategory(cat.id)).then(() => {
            expect(store.getActions()).toEqual([
                actions.categoriesReceived({
                    [cat.id]: cat,
                    [cat.categories[0].id]: cat.categories[0]
                })
            ])
        })
    })
})

test('getProduct uses a connector to get a product', () => {
    const prod = {id: '1234', title: 'Black Shoes'}
    class MockConnector {
        getProduct() {
            return Promise.resolve(prod)
        }
    }
    const storeFactory = configureStore([thunk.withExtraArgument({connector: new MockConnector()})])
    const initial = reducer(undefined, {type: '!!unknown'})
    const store = storeFactory(initial)
    return store.dispatch(actions.getProduct(prod.id)).then(() => {
        expect(store.getActions()).toEqual([actions.productsReceived({[prod.id]: prod})])
    })
})

describe('searchProducts uses a connector to search for products', () => {
    test('with empty result', () => {
        const result = {
            selectedFilters: {},
            start: 0,
            total: 1,
            query: 'asdf',
            count: 1,
            results: [
                {
                    productId: 1,
                    productName: 'asdf'
                }
            ]
        }
        const prod = {
            id: result.results[0].productId,
            name: result.results[0].productName
        }
        const searchRequest = {query: result.query}

        class MockConnector {
            searchProducts() {
                return Promise.resolve(result)
            }
        }
        const storeFactory = configureStore([
            thunk.withExtraArgument({connector: new MockConnector()})
        ])
        const initial = reducer(undefined, {type: '!!unknown'})
        const store = storeFactory(initial)
        return store.dispatch(actions.searchProducts(searchRequest)).then(() => {
            expect(store.getActions()).toEqual([
                actions.productsReceived({[prod.id]: prod}),
                actions.productSearchReceived({[stringify(searchRequest)]: result})
            ])
        })
    })

    test('with non-empty result', () => {
        const result = {
            selectedFilters: {},
            start: 0,
            total: 0,
            query: 'asdf',
            count: 0,
            results: []
        }
        const searchRequest = {query: result.query}

        class MockConnector {
            searchProducts() {
                return Promise.resolve(result)
            }
        }
        const storeFactory = configureStore([
            thunk.withExtraArgument({connector: new MockConnector()})
        ])
        const initial = reducer(undefined, {type: '!!unknown'})
        const store = storeFactory(initial)
        return store.dispatch(actions.searchProducts(searchRequest)).then(() => {
            expect(store.getActions()).toEqual([
                actions.productsReceived({}),
                actions.productSearchReceived({[stringify(searchRequest)]: result})
            ])
        })
    })
})
