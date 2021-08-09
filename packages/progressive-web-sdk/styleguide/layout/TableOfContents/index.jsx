import React, {Component} from 'react'
import PropTypes from 'prop-types'
import ComponentsList from '../ComponentsList'
import TableOfContentsRenderer from '../TableOfContentsRenderer'
import ToolbarButton from 'react-styleguidist/lib/rsg-components/ToolbarButton'
import filterSectionsByName from 'react-styleguidist/lib/utils/filterSectionsByName'

export default class TableOfContents extends Component {
    constructor() {
        super()

        this.state = {
            searchTerm: ''
        }
    }

    onSearchTermChange(searchTerm) {
        return this.setState({searchTerm})
    }

    renderBackButton() {
        const projectPrefix =
            window.location.hostname.indexOf('localhost') > -1 ? '' : '/progressive-web'
        const backUrl = `${projectPrefix}/${window.Mobify.version}/components/#/`
        return (
            <ul>
                <li>
                    <ToolbarButton href={backUrl}>
                        <strong>&larr; Back</strong>
                    </ToolbarButton>
                </li>
            </ul>
        )
    }

    renderSearch() {
        const {searchTerm} = this.state

        return (
            <input
                className="rsg-component-filter"
                value={searchTerm}
                placeholder="Filter by name"
                onChange={(event) => this.onSearchTermChange(event.target.value)}
            />
        )
    }

    renderLevel(sections) {
        const items = sections.map((section) => {
            const children = [...(section.sections || []), ...(section.components || [])]
            return Object.assign({}, section, {
                heading: !!section.name && children.length > 0,
                content: children.length > 0 && this.renderLevel(children)
            })
        })

        const isSearching = this.state.searchTerm.length > 0
        const isIsolated = !isSearching && items.length <= 1

        return (
            <div className="rsg-component-list">
                {isIsolated && this.renderBackButton()}
                {!isIsolated && this.renderSearch()}

                <ComponentsList items={items} />
            </div>
        )
    }

    renderSections() {
        const {searchTerm} = this.state
        const {sections} = this.props

        // If there is only one section, we treat it as a root section
        // In this case the name of the section won't be rendered and it won't get left padding
        const firstLevel = sections.length === 1 ? sections[0].components : sections
        const filtered = filterSectionsByName(firstLevel, searchTerm)

        return this.renderLevel(filtered)
    }

    render() {
        return <TableOfContentsRenderer>{this.renderSections()}</TableOfContentsRenderer>
    }
}

TableOfContents.propTypes = {
    sections: PropTypes.array.isRequired
}
