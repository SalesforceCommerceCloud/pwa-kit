import React from 'react'
import {Styled} from 'theme-ui'

function SchemaTable(props) {
    const {properties, required, operationId} = props
    return (
        <Styled.table>
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {properties.map((property) => {
                    const propertyEnum =
                        property.enum &&
                        JSON.parse(property.enum)
                            .map((i) => (i === null ? 'null' : i))
                            .join(', ')
                    return (
                        <tr key={`${operationId}_${property.name}`}>
                            <td>{property.name}</td>
                            <td>{property.type}</td>
                            <td>
                                {required && required.includes(property)
                                    ? 'Required. '
                                    : 'Optional. '}
                                {property.description && `${property.description}. `}
                                {property.enum && (
                                    <>
                                        <span>Allowed values </span>
                                        <code>{propertyEnum}</code>
                                    </>
                                )}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </Styled.table>
    )
}

export default SchemaTable
