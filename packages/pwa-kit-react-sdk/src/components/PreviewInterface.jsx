import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';

/**
 * Preview Interface Component
 * 
 * This component provides a simple interface for configuring preview settings
 * that can be embedded within the page designer.
 */
const PreviewInterface = ({ 
    onContextChange, 
    onError,
    className = '',
    style = {}
}) => {
    const intl = useIntl();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const form = useForm({
        defaultValues: {
            date: null,
            time: '',
            sourceCode: '',
            customerGroupIds: '',
            customQualifiers: [{ key: '', value: '' }]
        }
    });

    const { handleSubmit, control, watch, setValue } = form;
    const formValues = watch();

    const handleContextChange = async (context) => {
        try {
            setIsSubmitting(true);
            setError(null);

            if (onContextChange) {
                await onContextChange(context);
            }
        } catch (err) {
            setError(err.message || 'Failed to update preview context');
            if (onError) {
                onError(err);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onSubmit = async (data) => {
        const { date, time, sourceCode, customerGroupIds, customQualifiers } = data;
        
        let effectiveDateTime = null;
        if (date && time) {
            const dateTime = new Date(date);
            const [hours, minutes] = time.split(':');
            dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            effectiveDateTime = dateTime.toISOString();
        }

        const context = {
            effectiveDateTime,
            sourceCode: sourceCode || null,
            customerGroupIds: customerGroupIds ? customerGroupIds.split(',').map(id => id.trim()) : [],
            customQualifiers: customQualifiers ? 
                customQualifiers.reduce((acc, qualifier) => {
                    if (qualifier.key && qualifier.value) {
                        acc[qualifier.key] = qualifier.value;
                    }
                    return acc;
                }, {}) : {}
        };

        await handleContextChange(context);
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
        <div className={`preview-interface ${className}`} style={style}>
            <div className="preview-header">
                <h3>
                    {intl.formatMessage({
                        id: 'pageDesigner.preview.title',
                        defaultMessage: 'Preview Settings',
                        description: 'Preview settings title'
                    })}
                </h3>
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

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                    >
                        {isSubmitting ? (
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
                </div>
            </form>

            <style jsx>{`
                .preview-interface {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 0.25rem;
                    padding: 1rem;
                }

                .preview-header {
                    margin-bottom: 1rem;
                }

                .preview-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .preview-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .form-control {
                    padding: 0.5rem;
                    border: 1px solid #ced4da;
                    border-radius: 0.25rem;
                    font-size: 0.9rem;
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
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    font-size: 0.8rem;
                }

                .add-qualifier {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 0.8rem;
                }

                .error-message {
                    background: #dc3545;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    font-size: 0.8rem;
                }

                .form-actions {
                    margin-top: 1rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                }

                .btn-primary {
                    background: #007bff;
                    color: white;
                }

                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default PreviewInterface; 