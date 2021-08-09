import * as selectors from './selectors'
import Immutable from 'immutable'

test('getCategory works appropriately', () => {
    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    searchRequest: {
                        filters: {categoryId: 'tshirts'}
                    }
                })
            }
        },
        data: {
            categories: Immutable.fromJS({
                root: {id: 'root', name: 'StoreFront catalog'},
                tshirts: {id: 'tshirts', name: 'T-shirts'}
            })
        }
    }
    const result = selectors.getCategory(mockState, mockState)
    expect(result.toJS()).toEqual({id: 'tshirts', name: 'T-shirts'})
})

test('getCategoryBreadcrumb works appropriately', () => {
    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    searchRequest: {
                        filters: {categoryId: 'tshirts'}
                    }
                })
            }
        },
        data: {
            categories: Immutable.fromJS({
                root: {id: 'root', name: 'StoreFront catalog'},
                tshirts: {id: 'tshirts', name: 'T-shirts'}
            })
        }
    }
    const result = selectors.getCategoryBreadcrumb(mockState)
    expect(result.toJS()).toEqual([{text: 'Home', href: '/'}, {text: 'T-shirts'}])
})

test('getCategoryBreadcrumb when category not found', () => {
    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    searchRequest: {
                        filters: {categoryId: 'unknown'}
                    }
                })
            }
        },
        data: {
            categories: Immutable.fromJS({
                root: {id: 'root', name: 'StoreFront catalog'},
                tshirts: {id: 'tshirts', name: 'T-shirts'}
            })
        }
    }
    const result = selectors.getCategoryBreadcrumb(mockState)
    expect(result.toJS()).toEqual([{text: 'Home', href: '/'}])
})

test('getProductSearch works appropriately', () => {
    const searchesObj = {
        count: 6,
        results: [
            {
                available: true,
                productId: '1',
                productName: 'Mini-Logo Crew Neck T-Shirt',
                price: 20
            },
            {
                available: true,
                productId: '2',
                productName: 'Spark-Logo Crew Neck T-Shirt',
                price: 24.99
            },
            {
                available: true,
                productId: '3',
                productName: 'Mini-Logo Crew Neck T-Shirt',
                price: 20
            },
            {
                available: true,
                productId: '4',
                productName: 'Spark-Logo Crew Neck T-Shirt',
                price: 24.99
            },
            {
                available: true,
                productId: '5',
                productName: 'Mini-Logo Crew Neck T-Shirt',
                price: 20
            },
            {
                available: true,
                productId: '6',
                productName: 'Spark-Logo Crew Neck T-Shirt',
                price: 24.99
            }
        ]
    }

    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    searchRequest: {
                        filters: {categoryId: 'tshirts'},
                        query: ''
                    }
                })
            }
        },
        data: {
            productSearches: Immutable.fromJS({
                '{"filters":{"categoryId":"tshirts"},"query":""}': searchesObj
            })
        }
    }
    const result = selectors.getProductSearch(mockState, mockState)
    expect(result.toJS()).toEqual(searchesObj)
})

test('getErrorMessage works appropriately', () => {
    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    error: null,
                    searchRequest: {
                        filters: {categoryId: 'tshirts'}
                    }
                })
            }
        }
    }
    const result = selectors.getErrorMessage(mockState)
    expect(result).toEqual(null)
})
