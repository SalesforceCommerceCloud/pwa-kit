import {useContext} from 'react'
import Context from '../contexts/express-context'

const useExpress = () => {
    return useContext(Context)
}

export default useExpress