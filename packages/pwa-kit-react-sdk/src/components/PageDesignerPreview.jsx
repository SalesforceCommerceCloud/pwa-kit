import React, { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { postMessageAsync, createPreviewContext, validatePreviewContext, debug } from '../utils/page-designer-preview';

/**
 * Page Designer Preview Component
 * 
 * This component provides a preview interface for the page designer,
 * allowing users to configure preview context and view pages in different contexts.
 */
const PageDesignerPreview = ({ 
    siteId, 
    previewUrl, 
    onContextChange, 
    onError,
    className = '',
    style = {}
}) => {
    const intl = useIntl();
    const iframeRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormSubmitting, setIsFormSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);

    const form = useForm({
        defaultValues: {
            date: null,
            time: '',
            sourceCode: '',
            customerGroupIds: '',
            customQualifiers: [{ key: '', value: '' }]
        }
    });

    const { handleSubmit, control, watch, setValue, reset } = form;

    // Watch form values for real-time updates
    const formValues = watch();

    useEffect(() => {
        // Initialize form with URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const { sourceCode, customerGroupIds, customQualifiers, effectiveDateTime } = urlParams;
        
        if (sourceCode) setValue('sourceCode', sourceCode);
        if (customerGroupIds) setValue('customerGroupIds', customerGroupIds);
        
        if (customQualifiers) {
            try {
                const qualifiers = JSON.parse(customQualifiers);
                const qualifierArray = Object.entries(qualifiers).map(([key, value]) => ({ key, value }));
                setValue('customQualifiers', qualifierArray);
            } catch (e) {
                debug('Error parsing custom qualifiers', e);
            }
        }

        if (effectiveDateTime) {
            const date = new Date(effectiveDateTime);
            if (!isNaN(date.getTime())) {
                setValue('date', date);
                setValue('time', date.toTimeString().slice(0, 5));
            }
        }
    }, [setValue]);

    const handleIFrameLoad = () => {
        setIsLoading(false);
        debug('Page Designer Preview iframe loaded');
    };

    const handleContextChange = async (context) => {
        if (!validatePreviewContext(context)) {
            setError('Invalid preview context');
            return;
        }

        try {
            setIsFormSubmitting(true);
            setError(null);

            // Send context to parent window
            if (window.parent && window.parent !== window) {
                await postMessageAsync(context, window.location.origin, window.parent);
            }

            // Call the onContextChange callback if provided
            if (onContextChange) {
                await onContextChange(context);
            }

            debug('Preview context updated', context);
        } catch (err) {
            debug('Error updating preview context', err);
            setError(err.message || 'Failed to update preview context');
            if (onError) {
                onError(err);
            }
        } finally {
            setIsFormSubmitting(false);
        }
    };

    const onSubmit = async (data) => {
        const context = createPreviewContext(data);
        await handleContextChange(context);
    };

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const resetForm = () => {
        reset();
        // Clear URL parameters
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);
    };

    const addCustomQualifier = () => {
        const currentQualifiers = form.getValues('customQualifiers');
        setValue('customQualifiers', [...currentQualifiers, { key: '', value: '' }]);
    };

    const removeCustomQualifier = (index) => {
        const currentQualifiers = form.getValues('customQualifiers');
        const newQualifiers = currentQualifiers.filter((_, i) => i !== index);
        setValue('customQualifiers', newQualifiers);
    };

    return (
        <div className={`page-designer-preview ${className}`} style={style}>
            <div className="preview-container">
                {/* Preview Controls Drawer */}
                <div className={`preview-drawer ${isDrawerOpen ? 'open' : 'closed'}`}>
                    <div className="drawer-header">
                        <h3>
                            {intl.formatMessage({
                                id: 'pageDesigner.preview.title',
                                defaultMessage: 'Preview Settings',
                                description: 'Preview settings drawer title'
                            })}
                        </h3>
                        <button 
                            type="button" 
                            className="drawer-toggle"
                            onClick={toggleDrawer}
                            aria-label={intl.formatMessage({
                                id: 'pageDesigner.preview.toggleDrawer',
                                defaultMessage: 'Toggle preview settings',
                                description: 'Toggle preview settings drawer'
                            })}
                        >
                            {isDrawerOpen ? '←' : '→'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="preview-form">
                        {/* Date and Time */}
                        <div className="form-group">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.date',
                                    defaultMessage: 'Date',
                                    description: 'Date field label'
                                })}
                            </label>
                            <input
                                type="date"
                                {...control.register('date')}
                                className="form-control"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.time',
                                    defaultMessage: 'Time',
                                    description: 'Time field label'
                                })}
                            </label>
                            <input
                                type="time"
                                {...control.register('time')}
                                className="form-control"
                            />
                        </div>

                        {/* Source Code */}
                        <div className="form-group">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.sourceCode',
                                    defaultMessage: 'Source Code',
                                    description: 'Source code field label'
                                })}
                            </label>
                            <input
                                type="text"
                                {...control.register('sourceCode')}
                                className="form-control"
                                placeholder="Enter source code"
                            />
                        </div>

                        {/* Customer Group IDs */}
                        <div className="form-group">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.customerGroupIds',
                                    defaultMessage: 'Customer Group IDs',
                                    description: 'Customer group IDs field label'
                                })}
                            </label>
                            <input
                                type="text"
                                {...control.register('customerGroupIds')}
                                className="form-control"
                                placeholder="Enter comma-separated customer group IDs"
                            />
                        </div>

                        {/* Custom Qualifiers */}
                        <div className="form-group">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.customQualifiers',
                                    defaultMessage: 'Custom Qualifiers',
                                    description: 'Custom qualifiers field label'
                                })}
                            </label>
                            {formValues.customQualifiers?.map((qualifier, index) => (
                                <div key={index} className="qualifier-row">
                                    <input
                                        type="text"
                                        {...control.register(`customQualifiers.${index}.key`)}
                                        className="form-control"
                                        placeholder="Key"
                                    />
                                    <input
                                        type="text"
                                        {...control.register(`customQualifiers.${index}.value`)}
                                        className="form-control"
                                        placeholder="Value"
                                    />
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCustomQualifier(index)}
                                            className="remove-qualifier"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addCustomQualifier}
                                className="add-qualifier"
                            >
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.addQualifier',
                                    defaultMessage: 'Add Qualifier',
                                    description: 'Add custom qualifier button'
                                })}
                            </button>
                        </div>

                        {/* Form Actions */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={isFormSubmitting}
                                className="btn btn-primary"
                            >
                                {isFormSubmitting ? (
                                    intl.formatMessage({
                                        id: 'pageDesigner.preview.updating',
                                        defaultMessage: 'Updating...',
                                        description: 'Updating preview context'
                                    })
                                ) : (
                                    intl.formatMessage({
                                        id: 'pageDesigner.preview.update',
                                        defaultMessage: 'Update Preview',
                                        description: 'Update preview button'
                                    })
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="btn btn-secondary"
                            >
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.reset',
                                    defaultMessage: 'Reset',
                                    description: 'Reset form button'
                                })}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Iframe */}
                <div className="preview-iframe-container">
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.loading',
                                    defaultMessage: 'Loading preview...',
                                    description: 'Loading preview message'
                                })}
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {previewUrl && (
                        <iframe
                            ref={iframeRef}
                            src={previewUrl}
                            className="preview-iframe"
                            onLoad={handleIFrameLoad}
                            title={intl.formatMessage({
                                id: 'pageDesigner.preview.iframeTitle',
                                defaultMessage: 'Page Designer Preview',
                                description: 'Preview iframe title'
                            })}
                        />
                    )}
                </div>
            </div>

            <style jsx>{`
                .page-designer-preview {
                    display: flex;
                    height: 100vh;
                    position: relative;
                }

                .preview-container {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }

                .preview-drawer {
                    width: 320px;
                    background: #f8f9fa;
                    border-right: 1px solid #dee2e6;
                    overflow-y: auto;
                    transition: transform 0.3s ease;
                }

                .preview-drawer.closed {
                    transform: translateX(-100%);
                }

                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #dee2e6;
                }

                .drawer-toggle {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.5rem;
                }

                .preview-form {
                    padding: 1rem;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .form-control {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ced4da;
                    border-radius: 0.25rem;
                }

                .qualifier-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    align-items: center;
                }

                .remove-qualifier {
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                }

                .add-qualifier {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                }

                .form-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .preview-iframe-container {
                    flex: 1;
                    position: relative;
                }

                .preview-iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }

                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .loading-spinner {
                    text-align: center;
                }

                .error-message {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #dc3545;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    z-index: 1001;
                }
            `}</style>
        </div>
    );
};

export default PageDesignerPreview; 