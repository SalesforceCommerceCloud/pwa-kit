import React from 'react'
import {Link} from 'react-router-dom'
import fetch from 'cross-fetch'

const IS_REMOTE = typeof process !== 'undefined' 

const Home = ({product}) => {

    return <div>
      Navigation: <Link to="/search">Search</Link>

      <br />
      <br />

      <h1>Home:</h1>
      {product ?
        <div>
          Featured Product: {product.name} ({product.id})
        </div> :
        <div>
          Fetching featured product
        </div>
      }
      
    </div>
}

Home.getProps = async () => {
    const uri = IS_REMOTE ? 
      'https://b2c-graphql-server-production.mobify-storefront.com/graphql' : 
      'http://localhost:4000/graphql'

    const {data} = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({query: `{
        getProduct(options: {parameters: {id: "25752235M"}}) {
          id
          name
        }
      }`})
    })
      .then(r => r.json())

    
    return {
      product: data.getProduct
    }
}

export default Home
