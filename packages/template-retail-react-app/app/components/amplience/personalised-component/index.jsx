import React from 'react'
import PropTypes from 'prop-types'
import AmplienceWrapper from '../wrapper'

const PersonalisedComponent = ({
    content,
    components,
    limit,
    defaultContent,
    maxNumberMatches,
    variants,
    ...props
}) => {
    if (content) {
        if (limit) {
            content = content.slice(0, limit)
        }

        return content.map((contentItem, index) => (
            <AmplienceWrapper
                content={contentItem}
                components={components}
                key={index}
                {...props}
            />
        ))
    }

    return <></>
}

PersonalisedComponent.displayName = 'PersonalisedComponent'

PersonalisedComponent.propTypes = {
    content: PropTypes.array,
    components: PropTypes.object,
    limit: PropTypes.number,
    // These are not used, but content does contain it.
    defaultContent: PropTypes.object,
    maxNumberMatches: PropTypes.number,
    variants: PropTypes.array
}

export default PersonalisedComponent
