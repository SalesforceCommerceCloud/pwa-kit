import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import * as actions from './actions'

class MockConnector {
    getCategory() {
        return Promise.resolve({
            id: 'id',
            name: 'name',
            categories: []
        })
    }
}

const storeFactory = configureStore([thunk.withExtraArgument({connector: new MockConnector()})])

test(`Home actions`, () => {
    const store = storeFactory({})
    store.dispatch(actions.initializeHome())
    expect(store.getActions()).toEqual([
        {
            payload: {
                pageMetaData: {
                    description: 'Homepage for the Scaffold',
                    title: 'Scaffold Home'
                }
            },
            type: 'PAGE_METADATA_RECEIVED'
        }
    ])
})
