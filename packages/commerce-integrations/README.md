# Commerce Integrations

A customizable API abstraction layer for ecommerce backends.

### What does it include?

   1. A well-defined interface for ecommerce API Connectors.
   2. Salesforce and Hybris Connectors that you can use or extend right away.
   3. The Merlins Connector - a demo implementation of the interface using a
      screen-scraping backend.

Our Merlins connector shows how to build a data layer for ecommerce backends that do
not provide an API. By isolating browser dependencies like this, we can open up
opportunities for reuse in other contexts - AMP, Desktop, etc.


### Getting started

A crash course, with React/Redux:

```
import {SalesforceConnector} from '@mobify/commerce-integrations/dist/connectors/sfcc'
import {createStore, applyMiddleware, combineReducers} from 'redux'
import thunk from 'redux-thunk'


// 1. Import and extend a Connector
class CustomSalesforceConnector extends SalesforceConnector {

    searchProducts(searchParams, opts = {}) {
        // Customize the built-in method to add logging, as an example.
        console.log('Before call')
        return Promise.resolve()
            .then(() => super.searchProducts(searchParams, opts)
            .then((result) => {
                console.log('After call')
                return result
            }))
    }
}

const connector = CustomSalesforceConnector.fromConfig({
    basePath: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_4',
    defaultHeaders: {
        'x-dw-client-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }
})


// 2. Write Redux reducers
const products = (state = null, action) => {
  switch (action.type) {
    case 'PRODUCTS_RECEIVED':
      return action.products
    default:
      return state
  }
}

const reducer = combineReducers({products})


// 3. Initialize the Redux store and make the connector available in
// all redux-thunk actions, using `withExtraArgument`.
const store = createStore(
  reducer,
  applyMiddleware(thunk.withExtraArgument({connector: connector}))
)


// 4. Write Redux actions, as usual
export const productsReceived = (products) => {
    return {
      type: 'PRODUCTS_RECEIVED',
      products,
    }
}

export const searchProducts = (searchParams) => (dispatch, getState, {connector}) => {
    // Note: We can access the injected connector here
    return connector.searchProducts(searchParams)
        .then((products) => dispatch(productsReceived(products)))
}


// 5. To demo, log all state changes
store.subscribe((action) => {
    console.log('Action:')
    console.log(JSON.stringify(action, null, 4))
    console.log('State:')
    console.log(JSON.stringify(store.getState(), null, 4))
})

store.dispatch(searchProducts({filters: {categoryId: 'root'}}))

```

## Extending the Connector
This is an example of how you can extend a connector. Here, we want to retrieve the html content by id from a salesforce backend.
It is not currently implemented so we will add a new function to the salesforce connector to do so.


#### types/content.js
Create a file (i.e. content.js) to define the desired model (i.e. Content) for the response and export it so it can be used where needed. We recommend maintaining all custom models in a folder (i.e. types/)
```
/** @module types/Content **/

import PropTypes from 'prop-types'

/**
 * Content type definition
 * @typedef {module:@mobify/commerce-integrations/dist/types.Content} Content
 * @property {String} id The content id.
 * @property {String} name The content name.
 * @property {String} body The html content.
 */
export const Content = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    body: PropTypes.string
}
```

#### connectors/sfcc.js
First we create a custom salesforce connector that extends the original salesforce connector in order to add a custom command to the api. This custom command will call the salesforce api to retrieve the desired response from the salesforce backend. Within the function, the returned response will be parsed into the model defined above.
```

import {SalesforceConnector} from '@mobify/commerce-integrations'
import ShopApi from 'commercecloud-ocapi-client'

const config = {
    basePath: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/dw/shop/v20_4',
    defaultHeaders: {
        'x-dw-client-id': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    }
}


class CustomSalesforceConnector extends SalesforceConnector {
  /**
   * Takes a content id and returns a promise resolving into an commerce-integrations Content type.
  *
  * @param {modules:types/Identifier} id
  * @param {Object} opts a plain object used to pass optional parameters from the command to be used in the request.
  *
  * @returns {Promise<module:@mobify/commerce-integrations/dist/types.Content>}
  */
  getContent(id, opts = {}) {
    const api = new ShopApi.ContentApi(this.client)

    return api.getContentById(id, opts)
        .then((data) => this.parseGetContent(data))
  }

  /**
  * Takes a OCAPI Content object and parses it into a commerce-integrations Content type.
  * @param {Object} data a OCAPI {@link https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/18.3/shop/Documents/Content.html?cp=0_12_5_13|Content} document
  *
  * @returns {Promise<module:@mobify/commerce-integrations/dist/types.Content>}
  */
  parseGetContent(data) {
    const d = data
    return {
        id: d.id,
        name: d.name,
        body: d.c_body
    }
  }
}

export connector = new CustomSalesforceConnector(config)

```

## Changes

- Split the IM into a separate redux and api interface with three implementations
  (Hybris, SFCC, Merlins). See `src/commerce-connector.js` to begin with.
- Added comprehensive tests for all backends and the redux layer.
- Re-wrote API layer to take `window` or an API client as a parameter, to facilitate
  usage with JSDOM and simple testing.
- Used a VCR clone for HTTP recording/playback to isolate tests.
- Converted type definitions to React's PropTypes so these can be used in the app
  directly.
- Re-restructured the schema types so each type is it's own file and all types co-exists
  in the same folder to facilitate discoverable.
- Re-designed connectors as classes that implement an IM interface and demonstrated
  simple extension/overrides in project code.
- Used redux-thunk's builtin `withArgument()` constructor to inject a connector
  instance into all actions, avoiding the need for complex connector-extensions and
  initialization code.
