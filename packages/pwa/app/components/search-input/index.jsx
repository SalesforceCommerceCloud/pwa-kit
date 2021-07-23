import React, {forwardRef} from 'react'
import {Input, InputGroup, InputLeftElement} from '@chakra-ui/react'
import {SearchIcon} from '../icons'

/**
 * The SearchInput component is a stylized
 * text input made specifically for use in
 * the application header.
 * @param  {object} props
 * @param  {object} ref reference to the input element
 * @return  {React.ReactElement} - SearchInput component
 */
const SearchInput = forwardRef((props, ref) => {
    return (
        <InputGroup>
            <InputLeftElement pointerEvents="none">
                <SearchIcon />
            </InputLeftElement>
            <Input type="search" ref={ref} {...props} variant="filled" />
        </InputGroup>
    )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
