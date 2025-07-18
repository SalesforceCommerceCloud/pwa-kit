import React, { useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import PageDesignerPreview from './PageDesignerPreview';
import PreviewInterface from './PreviewInterface';

/**
 * Main Page Designer Preview App Component
 * 
 * This component serves as the main entry point for the page designer preview application.
 * It fetches configuration from the backend and renders the appropriate preview interface.
 */
const PageDesignerPreviewApp = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewContext, setPreviewContext] = useState(null);

    useEffect(() => {
        // Fetch configuration from the backend
        const fetchConfig = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get the current site ID from the URL or window object
                const siteId = window.SITE || 'default';
                
                // Fetch configuration from the REST API
                const response = await fetch(`/dw/bm/v1/experience_editor_configuration/${siteId}/preview`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch configuration: ${response.status}`);
                }

                const configData = await response.json();
                setConfig(configData);
            } catch (err) {
                console.error('Error fetching configuration:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const getAuthToken = () => {
        // Get the authentication token from the appropriate source
        // This would typically be stored in localStorage, sessionStorage, or a cookie
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    };

    const handleContextChange = async (context) => {
        try {
            setError(null);

            // Send context to backend
            const siteId = window.SITE || 'default';
            const response = await fetch(`/dw/bm/v1/experience_editor_preview_context/${siteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(context)
            });

            if (!response.ok) {
                throw new Error(`Failed to update preview context: ${response.status}`);
            }

            const contextData = await response.json();
            setPreviewContext(contextData);

            // Notify parent window of context change
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'pageDesignerPreviewContext',
                    source: 'page-designer-preview-client',
                    payload: context
                }, '*');
            }

            console.log('Preview context updated:', context);
        } catch (err) {
            console.error('Error updating preview context:', err);
            setError(err.message);
            throw err;
        }
    };

    const handleError = (err) => {
        console.error('Preview error:', err);
        setError(err.message);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    Loading Page Designer Preview...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    Error: {error}
                </div>
                <button onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    // Determine if we should show the full preview or just the interface
    const isFullPreview = window.location.search.includes('full=true');
    const previewUrl = config?.previewUrl || '';

    return (
        <IntlProvider locale="en" messages={{}}>
            <div className="page-designer-preview-app">
                {isFullPreview ? (
                    <PageDesignerPreview
                        siteId={window.SITE || 'default'}
                        previewUrl={previewUrl}
                        onContextChange={handleContextChange}
                        onError={handleError}
                    />
                ) : (
                    <PreviewInterface
                        onContextChange={handleContextChange}
                        onError={handleError}
                    />
                )}
            </div>

            <style jsx>{`
                .page-designer-preview-app {
                    height: 100vh;
                    width: 100%;
                }

                .loading-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    width: 100%;
                }

                .loading-spinner {
                    text-align: center;
                    font-size: 1.1rem;
                    color: #666;
                }

                .error-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    width: 100%;
                    gap: 1rem;
                }

                .error-message {
                    color: #dc3545;
                    font-size: 1.1rem;
                    text-align: center;
                }

                .error-container button {
                    padding: 0.5rem 1rem;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                }

                .error-container button:hover {
                    background: #0056b3;
                }
            `}</style>
        </IntlProvider>
    );
};

export default PageDesignerPreviewApp; 