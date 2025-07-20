import { useContext } from 'react'
import { DesignModeContext } from './DesignModeContext'

export const useDesignMode = () => {
    return useContext(DesignModeContext)
} 
