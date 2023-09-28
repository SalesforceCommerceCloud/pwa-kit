import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'

import {DEFAULT_SITE_TITLE} from '../../../constants'

const Seo = ({title, description, keywords, noIndex, children, ...props}) => {
    const fullTitle = title ? `${title} | ${DEFAULT_SITE_TITLE}` : DEFAULT_SITE_TITLE

    return (
        <Helmet {...props}>
            <title>{fullTitle}</title>
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            {noIndex && <meta name="robots" content="noindex" />}
            {children}
        </Helmet>
    )
}

Seo.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    noIndex: PropTypes.bool,
    children: PropTypes.node
}

export default Seo