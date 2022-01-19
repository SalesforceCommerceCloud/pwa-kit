import React from 'react'
import {Link} from 'react-router-dom'
import fetch from 'cross-fetch'
import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'

const Home = ({category, product}) => {

    return <div>
      <Link 
        to={`?cachebreaker=${Date.now()}`}
      >
        Click Me!
      </Link>
      <br />

      Category:
      <br />
      <code>
        {JSON.stringify(category)}
      </code>
      
      Product:
      <br />
      <code>
        {JSON.stringify(product)}
      </code>
    </div>
}

Home.shouldGetProps = ({location, previousLocation}) => {
  return location?.search !== previousLocation?.search
}

Home.getProps = async () => {
    // const data = await fetch('http://localhost:4000/graphql', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json',
    //   },
    //   body: JSON.stringify({query: "{ greeting }"})
    // })
    //   .then(r => r.json())

    const client = new ApolloClient({
      shouldBatch: true,
      uri: 'http://localhost:4000/graphql',
      fetch: fetch
    })

    // Run multiple queries with one call.
    // NOTE: This might be an ok solution if we are going to have a single
    // b2c commerce gql server, otherwise if we go the starter sever route,
    // project specific queries will be defined in that project. The idea would
    // be to have all the base schema in the SDK (or elsewhere) including some "helper"
    // queries for logging in, and creating baskets, or even getting data for PLP
    // (categories and serach results in one query), the gql starter will allow the 
    // devs to define their own custom/compound queries.
    const GET_CATEGORY_AND_PRODUCT = gql`
      query {
        getCategory(options: {parameters: {id: "womens"}}) {
          id
          name
          categories {
            id
          }
        }
        getProduct(options: {parameters: {id: "25752235M"}}) {
          id
          name
        }
      }
    `

    const {data} = await client.query({
      query: GET_CATEGORY_AND_PRODUCT
    })

    return {
      category: data.getCategory,
      product: data.getProduct
    }
}

export default Home
