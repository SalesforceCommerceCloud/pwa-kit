import React, {useRef, useEffect} from 'react'
import {connectSearchBox} from 'react-instantsearch-dom'
import close from '../../images/close.svg'
import styled from '@emotion/styled'

import SearchIcon from '../icons/SearchIcon'
import {useKeyPress} from '../../hooks/useKeyPress'

const Input = styled.input`
    outline: none;
    width: 100%;
    border: none;
    font-size: ${(p) => p.theme.fontSizes.md};
    transition: background-color 0.3s ease-in-out, color 0.3s ease-in;
    padding: ${(p) => p.theme.space.sm} 0;
    background-color: ${(p) => (p.isInputFocus ? p.theme.colors.white : 'rgba(0, 0, 0, 0.35)')};
    color: ${(p) => (p.isInputFocus ? p.theme.colors.black : p.theme.colors.white)};
    border-radius: ${(p) => p.theme.radii.sm};
    min-width: 200px;
    height: ${(p) => p.theme.inputHeight};
    padding-left: ${(p) => p.theme.space.largish};

    ::placeholder {
        color: ${(p) => (p.isInputFocus ? p.theme.colors.mediumGray : p.theme.colors.silver)};
    }
`

const Form = styled.form`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0;
    width: 100%;
    position: relative;
`
const RemoveSearchQuery = styled.div`
    position: absolute;
    right: ${(p) => p.theme.space.md};
    display: flex;
    cursor: pointer;
`

export default connectSearchBox(({refine, currentRefinement, isInputFocus, onKeyDown, ...rest}) => {
    const preventSubmit = (e) => {
        e.preventDefault()
    }
    const textInput = useRef(null)
    const slashPress = useKeyPress('/')
    useEffect(() => {
        if (slashPress) {
            textInput.current.focus()
        }
    }, [slashPress])

    return (
        <Form onSubmit={preventSubmit}>
            <SearchIcon focus={isInputFocus} />

            <Input
                type="text"
                ref={textInput}
                onKeyDown={onKeyDown}
                placeholder="Search DevCenter"
                aria-label="Search"
                isInputFocus={isInputFocus}
                value={currentRefinement}
                onChange={(e) => refine(e.target.value)}
                {...rest}
            />

            {currentRefinement.length > 0 ? (
                <RemoveSearchQuery onClick={() => refine('')}>
                    <img src={close} alt="remove search" />
                </RemoveSearchQuery>
            ) : null}
        </Form>
    )
})
