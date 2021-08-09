# Commerce Integrations

A customizable API abstraction layer for ecommerce backends.

### What does it include?

   1. A well-defined interface for ecommerce API Connectors.
   2. Salesforce and Hybris Connectors that you can use or extend right away.
   3. The Merlins Connector - a demo implementation of the interface using JSDOM
      to screen-scrape a legacy backend.

Our Merlins connector shows how to build a data layer for ecommerce backends that do
not provide an API.


### Getting started

A crash course in a Mobify-powered app using server-side rendering:

```
import {SalesforceConnector} from '@mobify/commerce-integrations/dist/connectors/sfcc'


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


// 2. Create an AppConfig in app/_app-config/index.jsx and use it to inject your
//    connector instance into the getProps methods on your page components.

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {getConnector} from '../../connector'

const AppConfig = (props) => {
    return <Fragment>{props.children}</Fragment>
}

AppConfig.restore = () => undefined

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = () => {
    return {
        connector: getConnector()
    }
}

AppConfig.propTypes = {
    children: PropTypes.node
}

export default AppConfig



// 3. Use your connector in your pages, like this:

class HomePage extends React.component {

    static async getProps({connector}) => {
        const searchResult = await connector.searchProducts({
            filters: {
                categoryId: 't-shirts'
            },
            query: ''
        })
        return {searchResult}
    }

    render(){
        const {searchResult} = this.props
        return <pre>{JSON.stringify(searchResult, null, 4)}</pre>
    }
}


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
 * @typedef {module:types/Content} Content
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
  * @returns {Promise<module:types/Content>}
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
  * @returns {Promise<module:types/Content>}
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
