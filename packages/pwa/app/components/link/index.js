import React from 'react'
import PropTypes from 'prop-types'
import {Link as SPALink} from 'react-router-dom'
import {useLocale} from '../../locale'

const Link = ({href, to, ...props}) => {
    const _href = to || href
    const [locale] = useLocale()
    const localePath = `/${locale}`
    const localizedHref = _href && _href.includes(localePath) ? _href : `${localePath}${_href}`

    return <SPALink {...props} to={_href === '/' ? '/' : localizedHref} />
}

Link.propTypes = {href: PropTypes.string, to: PropTypes.string}

export default React.memo(Link)
