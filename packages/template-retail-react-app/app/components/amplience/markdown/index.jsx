import React from 'react'
import PropTypes from 'prop-types'
import markdownIt from 'markdown-it'
import highlightjs from 'markdown-it-highlightjs'

/**
 * Amplience Markdown Component
 * Renders markdown as HTML.
 */
const AmplienceMarkdown = ({content, ...otherProps}) => {
    const md = markdownIt().use(highlightjs)
    const html = md.render(content ?? '')

    return <div dangerouslySetInnerHTML={{__html: html}} {...otherProps}></div>
}

AmplienceMarkdown.displayName = 'AmplienceMarkdown'

AmplienceMarkdown.propTypes = {
    /**
     * Markdown Content
     */
    content: PropTypes.string
}

export default AmplienceMarkdown
