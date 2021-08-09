/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related component:
 *
 * * [Ledger](#!/Ledger)
 *
 * This is used inside ledger component to display each row of the table.
 *
 * @example ./DESIGN.md
 */

const LedgerRow = ({
    className,
    isTotal,
    label,
    labelAction,
    labelDescription,
    value,
    valueAction
}) => {
    const classes = classNames(
        'pw-ledger__row',
        {
            'pw--total': isTotal
        },
        className
    )

    return (
        <tr className={classes}>
            <td className="pw-ledger__item">
                {label}

                {(labelDescription || labelAction) && (
                    <div className="pw-ledger__details">
                        {labelDescription}

                        <div className="pw-ledger__action">{labelAction}</div>
                    </div>
                )}
            </td>
            <td className="pw-ledger__value">
                {value}

                {valueAction && (
                    <div className="pw-ledger__details">
                        <div className="pw-ledger__action">{valueAction}</div>
                    </div>
                )}
            </td>
        </tr>
    )
}

LedgerRow.displayName = 'LedgerRow'

LedgerRow.propTypes = {
    /**
     * Additional classes to add to the ledgerRow container.
     */
    className: PropTypes.string,

    /**
     * Indicates whether this ledger entry is the final total row.
     */
    isTotal: PropTypes.bool,

    /**
     * The label for the ledger entry.
     */
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Additional content that appears within the `pw-ledger__item` container.
     */
    labelAction: PropTypes.node,

    /**
     * Label description for ledger entry.
     */
    labelDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The value for the ledger entry.
     */
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Additional content that appears within the `pw-ledger__value` container.
     */
    valueAction: PropTypes.node
}

export default LedgerRow
