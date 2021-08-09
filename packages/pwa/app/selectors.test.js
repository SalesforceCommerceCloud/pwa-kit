import * as selectors from './selectors'
import Immutable from 'immutable'

describe('ui state functions appropriately', () => {
    const mockState = {
        ui: {
            pages: {
                productList: Immutable.fromJS({
                    searchRequest: {
                        filters: {categoryId: 'unknown'}
                    }
                }),
                home: Immutable.fromJS({}),
                getProductDetails: Immutable.fromJS({
                    isShippingOpen: false,
                    isSubscribed: false,
                    productId: 1
                })
            },
            globals: Immutable.fromJS({
                pageMetaData: {title: 'tshirt', description: ''}
            })
        }
    }

    test('getUI works appropriately', () => {
        expect(selectors.getUI(mockState)).toEqual(mockState.ui)
    })

    test('getGlobals work appropriately', () => {
        expect(selectors.getGlobals(mockState)).toEqual(mockState.ui.globals)
    })

    test('getPageMetaData works appropriately', () => {
        expect(selectors.getPageMetaData(mockState)).toEqual(
            mockState.ui.globals.get('pageMetaData')
        )
    })

    test('getPages work appropriately', () => {
        expect(selectors.getPages(mockState)).toEqual(mockState.ui.pages)
    })

    test('getHome works appropriately', () => {
        expect(selectors.getHome(mockState)).toEqual(mockState.ui.pages.home)
    })

    test('getProductDetails works appropriately', () => {
        expect(selectors.getProductDetails(mockState)).toEqual(mockState.ui.pages.productDetails)
    })

    test('getProductList works appropriately', () => {
        expect(selectors.getProductList(mockState)).toEqual(mockState.ui.pages.productList)
    })
})

describe('data state functions appropriately', () => {
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
        data: {
            categories: Immutable.fromJS({
                root: {id: 'root', name: 'StoreFront catalog'},
                tshirts: {id: 'tshirts', name: 'T-shirts'}
            }),
            productSearches: Immutable.fromJS({
                '{"filters":{"categoryId":"tshirts"},"query":""}': searchesObj
            }),
            products: Immutable.fromJS([
                {name: 'product 0', id: 0},
                {name: 'product 1', id: 1},
                {name: 'product 2', id: 2},
                {name: 'product 3', id: 3},
                {name: 'product 4', id: 4}
            ])
        }
    }

    test('getData works appropriately', () => {
        expect(selectors.getData(mockState)).toEqual(mockState.data)
    })

    test('getCategories work appropriately', () => {
        expect(selectors.getCategories(mockState)).toEqual(mockState.data.categories)
    })

    test('getProducts work appropriately', () => {
        expect(selectors.getProducts(mockState)).toEqual(mockState.data.products)
    })

    test('getProductSearches work appropriately', () => {
        expect(selectors.getProductSearches(mockState)).toEqual(mockState.data.productSearches)
    })
})

describe('Offline selectors work appropriately', () => {
    const mockState = {offline: Immutable.fromJS({startTime: null})}
    test('getOffline works appropriately', () => {
        expect(selectors.getOffline(mockState)).toEqual(mockState.offline)
    })

    test('getOfflineModeStartTime works appropriately', () => {
        expect(selectors.getOfflineModeStartTime(mockState)).toEqual(
            mockState.offline.get('startTime')
        )
    })
})

describe('convertCategoryToNode works appropriately', () => {
    const categories = Immutable.fromJS({
        root: {
            id: 'root',
            name: 'StoreFront catalog',
            categories: [{name: 'All', id: 'all', description: 'Jacket'}]
        },
        tshirts: {id: 'tshirts', name: 'T-shirts'}
    })

    test('category without categories array', () => {
        const category = categories.get('tshirts')
        expect(selectors.convertCategoryToNode(category)).toEqual(
            Immutable.fromJS({
                title: category.get('name'),
                path: `/category/${category.get('id')}`,
                children: Immutable.List()
            })
        )
    })

    test('category with categories array', () => {
        const category = categories.get('root')
        expect(selectors.convertCategoryToNode(category)).toEqual(
            Immutable.fromJS({
                title: category.get('name'),
                path: '/',
                children: [
                    {
                        title: category
                            .get('categories')
                            .get(0)
                            .get('name'),
                        path: `/category/${category
                            .get('categories')
                            .get(0)
                            .get('id')}`,
                        children: Immutable.List()
                    }
                ]
            })
        )
    })
})

describe('test getNavigationRoot', () => {
    test('when root category exists', () => {
        const mockState = {
            data: {
                categories: Immutable.fromJS({
                    root: {id: 'root', name: 'StoreFront catalog'},
                    tshirts: {id: 'tshirts', name: 'T-shirts'}
                })
            }
        }
        const result = selectors.getNavigationRoot(mockState)
        const category = mockState.data.categories.get('root')
        expect(result).toEqual(
            Immutable.fromJS({
                title: category.get('name'),
                path: '/',
                children: Immutable.List()
            })
        )
    })

    test('when root category does not exist', () => {
        const mockState = {
            data: {
                categories: Immutable.fromJS({
                    tshirts: {id: 'tshirts', name: 'T-shirts'}
                })
            }
        }
        const result = selectors.getNavigationRoot(mockState)
        expect(result).toEqual(
            Immutable.fromJS({
                title: 'root',
                path: '/'
            })
        )
    })
})

describe('test getNavigationRootDesktop', () => {
    test(`when top-level categories don't exceed limit, categories won't overflow`, () => {
        const mockState = {
            data: {
                categories: Immutable.fromJS({
                    root: {
                        id: 'root',
                        name: 'StoreFront catalog',
                        categories: [
                            {
                                id: 'l11',
                                name: 'l11'
                            }
                        ]
                    }
                })
            }
        }
        const result = selectors.getNavigationRootDesktop(mockState)
        const lastTopLevelCategory = result.toJS().children[result.toJS().children.length - 1]

        expect(lastTopLevelCategory.path).not.toEqual('/more')
    })

    test(`when top-level categories exceed limit, categories will overflow`, () => {
        const mockState = {
            data: {
                categories: Immutable.fromJS({
                    root: {
                        id: 'root',
                        name: 'StoreFront catalog',
                        categories: [
                            {
                                id: 'l11',
                                name: 'l11'
                            },
                            {
                                id: 'l12',
                                name: 'l12'
                            },
                            {
                                id: 'l13',
                                name: 'l13'
                            },
                            {
                                id: 'l14',
                                name: 'l14'
                            },
                            {
                                id: 'l15',
                                name: 'l15'
                            },
                            {
                                id: 'l16',
                                name: 'l16'
                            }
                        ]
                    }
                })
            }
        }
        const result = selectors.getNavigationRootDesktop(mockState)
        const lastTopLevelCategory = result.toJS().children[result.toJS().children.length - 1]

        expect(lastTopLevelCategory.path).toEqual('/more')
    })
})
