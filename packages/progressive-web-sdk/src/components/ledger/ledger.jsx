/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import LedgerRow from './ledger-row'

/**
 * Related component:
 *
 * * [LedgerRow](#!/LedgerRow)
 *
 * A table/ledger component used to display order summaries.
 *
 * @example ./DESIGN.md
 */

const Ledger = ({children, className, rows}) => {
    const classes = classNames('pw-ledger', className)

    if (children) {
        return (
            <table className={classes}>
                <tbody>{children}</tbody>
            </table>
        )
    }

    return (
        <table className={classes}>
            <tbody>
                {rows.map((row, idx) => {
                    return <LedgerRow {...row} key={idx} />
                })}
            </tbody>
        </table>
    )
}

const ledgerRowPropType = (props, propName, componentName) => {
    let error
    const prop = props[propName]

    React.Children.forEach(prop, (child) => {
        if (!!child && child.type.displayName !== 'LedgerRow') {
            error = new Error(`${componentName} only accepts children of type "LedgerRow"`)
        }
    })
    return error
}

Ledger.propTypes = {
    /**
     * Content for the ledger, must be of type LedgerRow.
     */
    children: ledgerRowPropType,

    /**
     * Additional classes to add to the ledger container.
     */
    className: PropTypes.string,

    /**
     * A collection of objects defining the content in each entry in the Ledger.
     * (See Details of rows prop below for more info)
     */
    rows: PropTypes.arrayOf(
        PropTypes.shape({
            isTotal: PropTypes.bool,
            label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        })
    )
}

export default Ledger
