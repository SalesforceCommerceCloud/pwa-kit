const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const { buildSchema } = require('graphql')
const cors = require('cors')
const CommerceSdk = require('commerce-sdk')

const { ClientConfig, helpers, Product, Search } = CommerceSdk;

// Helpers
const withGuestAuth = async (fn, config) => {
  const token = await helpers.getShopperToken(config, { type: "guest" })
  
  // Add the token to the client configuration
  config.headers["authorization"] = token.getBearerHeader()

  return await fn(config)
}

const config = {
  headers: {},
  parameters: {
    clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
    organizationId: 'f_ecom_zzrf_001',
    shortCode: '8o7m175y',
    siteId: 'RefArchGlobal'
  }
}


// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
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

  type Product {
    id: String,
    name: String
  }

  type ProductSearchHit {
    productId: String,
    productName: String
  }

  type ProductSearchResult {
    limit: Int,
    hits: [ProductSearchHit],
    query: String,
    selectedSortingOption: String,
    offset: Int,
    total: Int
  }

  type Query {
    getCategory(options: CategoryQuery): Category,
    getProduct(options: ProductQuery): Product,
    productSearch(options: SearchQuery): ProductSearchResult
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  getProduct: async ({options}) => {
    const product = await withGuestAuth(async () => {
      // Create a new ShopperSearch API client
      const productClient = new Product.ShopperProducts(config)

      // Get a known product
      return await productClient.getProduct(options)
    }, config)

    return product 
  },
  getCategory: async ({options}) => {
    const category = await withGuestAuth(async () => {
      // Create a new ShopperSearch API client
      const productClient = new Product.ShopperProducts(config)

      // Get a known product
      return await productClient.getCategory(options)
    }, config)

    return category 
  },
  productSearch: async ({options}) => {
    const productSearchResult = await withGuestAuth(async () => {
      // Create a new ShopperSearch API client
      const searchClient = new Search.ShopperSearch(config);

      // Get a known product
      return await searchClient.productSearch(options)
    }, config)

    return productSearchResult    
  }
}

const app = express()
app.use(cors())
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}))
app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/graphql')