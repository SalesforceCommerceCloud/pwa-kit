import React from 'react'
import PropTypes from 'prop-types'

//Amplience Rendering Templates
import AmplienceWrapper from '../wrapper'

const flexibleListSlot = ({...props}) => {
    const content = props.content
    const meta = props._meta

    if (content) {
        return (
            <>
                {content.map((content, index) => {
                    return <AmplienceWrapper content={{...content, slot: meta}} key={index} />
                })}
            </>
        )
    } else {
        return <></>
    }
}

flexibleListSlot.displayName = 'Flexible List Slot'

flexibleListSlot.propTypes = {
    content: PropTypes.array
}

export default flexibleListSlot
