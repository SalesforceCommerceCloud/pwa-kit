import React from 'react'
import PropTypes from 'prop-types'

const year = new Date().getFullYear()

const Footer = ({year}) => (
    <footer className="c-footer u-padding-top-lg u-padding-bottom-lg">
        <div className="c-footer__content">
            <p className="qa-footer__copyright">&copy; {year} Mobify Research & Development Inc.</p>
        </div>
    </footer>
)

Footer.defaultProps = {
    year
}

Footer.propTypes = {
    year: PropTypes.node
}

export default Footer
