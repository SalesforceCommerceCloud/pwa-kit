/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const cors = require("cors");
const CommerceSdk = require("commerce-sdk");
const awsServerlessExpress = require('aws-serverless-express')
const { makeExecutableSchema } = require('graphql-tools')
const { helpers, Product, Search } = CommerceSdk;
const IS_LOCAL = process.env["AWS_LAMBDA_FUNCTION_NAME"] === undefined;
const PORT = process.env.PORT || 4000;

const config = {
  headers: {},
  parameters: {
    clientId: "c9c45bfd-0ed3-4aa2-9971-40f88962b836",
    organizationId: "f_ecom_zzrf_001",
    shortCode: "8o7m175y",
    siteId: "RefArchGlobal"
  }
};

// Helpers
const withGuestAuth = async (fn, config) => {
  const token = await helpers.getShopperToken(config, { type: "guest" });

  // Add the token to the client configuration
  config.headers["authorization"] = token.getBearerHeader();

  return await fn(config);
};

// Construct a schema, using GraphQL schema language
var typeDefs = `
  input Header {
    key: String,
    value: String
  }

  input CategoryQueryParameters {
    organizationId: String,
    id: String,
    levels: Int,
    locale: String,
    siteId: String
  }

  input ProductQueryParameters {
    organizationId: String,
    id: String,
    inventoryIds: String,
    currency: String,
    locale: String,
    allImages: Boolean,
    perPricebook: Boolean,
    siteId: String
  }

  input SearchQueryParameters {
    organizationId: String,
    siteId: String,
    q: String,
    refine: [String],
    sort: String,
    currency: String,
    locale: String,
    offset: Int,
    limit: Int,
  }

  input CategoryQuery {
    parameters: CategoryQueryParameters,
    headers: [Header]
  }

  input ProductQuery {
    parameters: ProductQueryParameters,
    headers: [Header]
  }

  input SearchQuery {
    parameters: SearchQueryParameters,
    headers: [Header]
  }

  type Category {
    categories: [Category],
    description: String,
    id: String,
    image: String,
    name: String,
    pageDescription: String,
    pageKeywords: String,
    pageTitle: String,
    parentCategoryId: String,
    thumbnail: String
  }

  type Variant {
    productId: String
  }

  type Product {
    id: String,
    name: String,
    variants: [Variant]
  }

  type ProductResult {
    limit: Int,
    data: [Product],
    total: Int
  }

  type ProductSearchHit {
    productId: String,
    productName: String
  }

  type ProductSearchResult {
    limit: Int,
    hits: [ProductSearchHit],
    products: [Product],
    query: String,
    selectedSortingOption: String,
    offset: Int,
    total: Int
  }

  type Query {
    getCategory(options: CategoryQuery): Category,
    getProduct(options: ProductQuery): Product,
    productSearch(options: SearchQuery, includeProducts: Boolean): ProductSearchResult
  }
`

const resolvers = {
  Query: {
    getProduct: async (_, { options }) => {
      const product = await withGuestAuth(async () => {
        // Create a new ShopperSearch API client
        const productClient = new Product.ShopperProducts(config)
  
        return await productClient.getProduct(options)
      }, config)
  
      return product
    },
    getCategory: async (_, { options }) => {
      const category = await withGuestAuth(async () => {
        // Create a new ShopperSearch API client
        const productClient = new Product.ShopperProducts(config)

        return await productClient.getCategory(options)
      }, config)

      return category
    },
    productSearch: async (_, { options, includeProducts}) => {
      const productSearchResult = await withGuestAuth(async () => {
        // Create a new ShopperSearch API client
        const searchClient = new Search.ShopperSearch(config)

        let searchResult = await searchClient.productSearch(options)
        console.log('includeProducts: ', includeProducts)
        if (includeProducts) {
          const productClient = new Product.ShopperProducts(config)

          const productIds = searchResult.hits.map(({productId}) => productId)
          console.log('productIds: ', productIds.length)
          const productResult = await productClient.getProducts({
            parameters: {
              ids: productIds.join(',')
            }
          })
          
          searchResult = {
            ...searchResult,
            products: productResult.data
          }
        }

        return searchResult
      }, config)

      return productSearchResult
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

const app = express();
app.use(cors());
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    // rootValue: root,
    graphiql: true
  })
);

if (IS_LOCAL) {
  app.listen(PORT, () =>
    console.log(`Running GraphQL server @ http://localhost:${PORT}/graphql`)
  );
  exports.get = () => {};
} else {
  const server = awsServerlessExpress.createServer(app);
  exports.get = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
  };
}
