import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

const Seo = ({title, description, noIndex, children, ...props}) => {
    const siteName = 'Retail React App'
    const fullTitle = title ? `${title} | ${siteName}` : siteName

    return (
        <Helmet {...props}>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {noIndex && <meta name="robots" content="noindex" />}
            {children}
        </Helmet>
    )
}

Seo.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    noIndex: PropTypes.bool,
    children: PropTypes.node
}

export default Seo
