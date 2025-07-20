import React, {useEffect, useState} from 'react'
import {useLocation} from 'react-router-dom'
import {usePageDesignerMode} from '../context/usePageDesignerMode'
import {Page} from '@salesforce/commerce-sdk-react/components'

type PreviewModeRendererProps = {
    children: React.ReactNode
    pageId?: string
    aspectTypeId?: string
    productId?: string
    categoryId?: string
    aspectAttributes?: string
}

export const PreviewModeRenderer = ({
    children,
    pageId,
    aspectTypeId,
    productId,
    categoryId,
    aspectAttributes
}: PreviewModeRendererProps) => {
    const {isPreviewMode} = usePageDesignerMode()
    const location = useLocation()
    const [pageData, setPageData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Get page ID from URL params if not provided
    const getPageIdFromUrl = () => {
        const query = new URLSearchParams(location.search)
        return query.get('pageId') || pageId
    }

    // Get aspect type from URL params if not provided
    const getAspectTypeFromUrl = () => {
        const query = new URLSearchParams(location.search)
        return query.get('aspectTypeId') || aspectTypeId
    }

    // Get product ID from URL params if not provided
    const getProductIdFromUrl = () => {
        const query = new URLSearchParams(location.search)
        return query.get('productId') || productId
    }

    // Get category ID from URL params if not provided
    const getCategoryIdFromUrl = () => {
        const query = new URLSearchParams(location.search)
        return query.get('categoryId') || categoryId
    }

    // Get aspect attributes from URL params if not provided
    const getAspectAttributesFromUrl = () => {
        const query = new URLSearchParams(location.search)
        return query.get('aspectAttributes') || aspectAttributes
    }

    useEffect(() => {
        if (!isPreviewMode) {
            setPageData(null)
            setError(null)
            return
        }

        const fetchPageData = async () => {
            setLoading(true)
            setError(null)

            try {
                const currentPageId = getPageIdFromUrl()
                const currentAspectTypeId = getAspectTypeFromUrl()
                const currentProductId = getProductIdFromUrl()
                const currentCategoryId = getCategoryIdFromUrl()
                const currentAspectAttributes = getAspectAttributesFromUrl()

                if (!currentPageId && !currentAspectTypeId) {
                    setError('No page ID or aspect type ID provided for preview mode')
                    setLoading(false)
                    return
                }

                // Build the API URL for fetching page data
                let apiUrl = '/api/shopper-experience/pages'
                const params = new URLSearchParams()

                if (currentPageId) {
                    params.append('pageId', currentPageId)
                }
                if (currentAspectTypeId) {
                    params.append('aspectTypeId', currentAspectTypeId)
                }
                if (currentProductId) {
                    params.append('productId', currentProductId)
                }
                if (currentCategoryId) {
                    params.append('categoryId', currentCategoryId)
                }
                if (currentAspectAttributes) {
                    params.append('aspectAttributes', currentAspectAttributes)
                }

                if (params.toString()) {
                    apiUrl += `?${params.toString()}`
                }

                const response = await fetch(apiUrl)
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch page data: ${response.statusText}`)
                }

                const data = await response.json()
                setPageData(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch page data')
            } finally {
                setLoading(false)
            }
        }

        fetchPageData()
    }, [isPreviewMode, location.search, pageId, aspectTypeId, productId, categoryId, aspectAttributes])

    // If not in preview mode, render children normally
    if (!isPreviewMode) {
        return <>{children}</>
    }

    // Show loading state
    if (loading) {
        return (
            <div className="pd-preview-mode">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    fontSize: '16px'
                }}>
                    Loading preview content...
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="pd-preview-mode">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '200px',
                    fontSize: '16px',
                    color: '#ff6b35'
                }}>
                    Preview Error: {error}
                </div>
            </div>
        )
    }

    // Render the page data if available
    if (pageData) {
        return (
            <div className="pd-preview-mode">
                <Page 
                    page={pageData} 
                    components={pageData.components || {}}
                />
            </div>
        )
    }

    // Fallback to children if no page data
    return <>{children}</>
} 