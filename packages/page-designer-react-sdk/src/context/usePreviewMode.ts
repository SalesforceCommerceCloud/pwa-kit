import { useContext } from 'react'
import { PreviewModeContext } from './PreviewModeContext'

export const usePreviewMode = () => {
    return useContext(PreviewModeContext)
} 