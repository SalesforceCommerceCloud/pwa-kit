import React from 'react'

import data from 'retail-react-app/app/components/data/data.json'

const Data = () => (
    <div dangerouslySetInnerHTML={{
        __html: JSON.stringify(data)
    }} />
)

export default Data