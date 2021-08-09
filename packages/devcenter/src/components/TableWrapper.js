import React from 'react'
import styled from '@emotion/styled'

function TableWrapper(props) {
    return <StyledTableWrapper>{props.children}</StyledTableWrapper>
}

const StyledTableWrapper = styled.div`
    overflow: auto;
`

export default TableWrapper
