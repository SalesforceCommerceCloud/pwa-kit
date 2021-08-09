import React from 'react'
import SVG from './SVG'

const ExternalLink = ({fill = '#fff'}) => (
    <SVG viewBox="0 0 24 24">
        <path
            d="M5 3c-1.094 0-2 .906-2 2v14c0 1.094.906 2 2 2h14c1.094 0 2-.906 2-2v-7h-2v7H5V5h7V3zm9 0v2h3.586l-9.293 9.293 1.414 1.414L19 6.414V10h2V3zm0 0"
            fill={fill}
        />
    </SVG>
)

export default ExternalLink
