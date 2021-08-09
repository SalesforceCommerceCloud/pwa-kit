import React from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'

Accordion.propTypes = {
    heading: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired
}

function Accordion({heading: Heading = 'h3', title, children}) {
    return (
        <StyledAccordion>
            <summary>
                <Heading id={title} className="according__heading">
                    {title}
                </Heading>
            </summary>
            {children}
        </StyledAccordion>
    )
}

const StyledAccordion = styled.details`
    margin-bottom: ${(p) => p.theme.space.md};
    summary {
        display: flex;
        align-items: baseline;
    }

    .according__heading {
        display: inherit;
    }
`

export default Accordion
