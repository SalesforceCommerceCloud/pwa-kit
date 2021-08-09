import {useEffect} from 'react'

function useScrollToHash() {
    useEffect(() => {
        const {hash} = window !== undefined ? window.location : ''
        if (hash) {
            const id = hash.replace('#', '')
            const element = document.getElementById(id)
            if (element) element.scrollIntoView({block: 'start', behavior: 'auto'})
        }
    }, [])
}

export default useScrollToHash
