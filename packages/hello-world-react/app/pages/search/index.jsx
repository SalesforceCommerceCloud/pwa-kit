import React, {useState} from 'react'
import {Link} from 'react-router-dom'
import fetch from 'cross-fetch'
import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'

const Search = ({category, searchResults}) => {
    const [searchVal, setSearchVal] = useState('')

    return <div>
      Navigation: <Link to="/">Home</Link>

      <br />
      <br />
      <input type="text" onChange={(e) => {setSearchVal(e.target.value)}} value={searchVal} />
      <Link 
        to={`/search?q=${searchVal}&cachebreaker=${Date.now()}`}
      >
        Search
      </Link>

      <br />
      
      {category &&
        <div>
          <b>Category:&nbsp;</b>{category.name}
        </div>
      }
      
      <br />
      
      {searchResults && searchResults.total ?
        <div>
          Found {searchResults.total} Results Showing {searchResults.hits.length}:
          <ul>
            {searchResults.hits.map(({productId, productName}) => {
              return <li key={productId}>{productName}</li>
            })}
          </ul>
        </div> :
        <div>
          No results
        </div>
      }

      {!searchResults && 
        <div>Loading serach results...</div>
      }
    </div>
}

Search.shouldGetProps = ({location, previousLocation}) => {
  return location?.search !== previousLocation?.search
}

Search.getProps = async ({location}) => {
  
    const params = new URLSearchParams(location.search)
    let q = params.get('q') || ''

    const client = new ApolloClient({
      shouldBatch: true,
      uri: 'http://localhost:4000/graphql',
      fetch: fetch
    })

    // NOTE: There are potentially 2 scenarios. 
    // 1. we host and run a graphql server that has a set schema not 
    // allowing partners to change it. 
    // 2. we generate a graphql project that uses a base schema that we 
    // intend the developer will change/modify.
    //
    // The current implementation is the former, where you can imagine
    // the later having implemented a query in the server called `getSearchPageData`,
    // the benifit there is the way you can develop the "back-end" independently
    // of the front-end ui.
    const GET_CATEGORY_AND_PRODUCT = gql`
      query {
        getCategory(options: {parameters: {id: "womens"}}) {
          id
          name
          categories {
            id
          }
        }
        productSearch(options: {parameters: {q: "${q}"}}) {
          hits {
            productId
            productName
          }
          total
        }
      }
    `

    const {data} = await client.query({
      query: GET_CATEGORY_AND_PRODUCT
    })

    console.log('productSearch: ', data.productSearch)
    return {
      category: data.getCategory,
      searchResults: data.productSearch
    }
}

export default Search
