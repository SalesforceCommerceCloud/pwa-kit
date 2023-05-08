import React from 'react'

import data from './data.json'

const Data = () => (
    <div dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
    }} />
)

export default Data