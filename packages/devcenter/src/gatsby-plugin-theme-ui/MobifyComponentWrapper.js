import React from 'react'
import PropTypes from 'prop-types'
import SpriteSheet from './SpriteSheet'

const MobifyComponentWrapper = ({children, className, ...props}) => (
    <div className="sdk-base">
        <div className="rsg--preview" onClick={props.onClick}>
            {props.spriteSheet &&
                <span
                    style={{display: 'none'}}
                    dangerouslySetInnerHTML={{
                        __html: SpriteSheet
                    }}
                />
            }
            {children}
        </div>
    </div>
)

MobifyComponentWrapper.propTypes = {
    children: PropTypes.element.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    spriteSheet: PropTypes.bool
}

export default MobifyComponentWrapper
