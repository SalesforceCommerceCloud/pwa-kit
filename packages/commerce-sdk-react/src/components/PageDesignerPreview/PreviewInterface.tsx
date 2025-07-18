/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'
import {useForm, Controller} from 'react-hook-form'
import type {PageDesignerPreviewContext, PageDesignerPreviewDevice, PageDesignerPreviewConfiguration} from './types'
import {buildPreviewUrl, parsePreviewParams, sendContextChangeMessage, sendNavigationChangeMessage} from './utils'

interface PreviewFormValues {
    sourceCode: string
    customerGroupIds: string
    date: Date | null
    time: string
    device: string
    customQualifiers: Array<{key: string; value: string}>
}

interface PreviewInterfaceProps {
    configuration: PageDesignerPreviewConfiguration
    onContextChange?: (context: PageDesignerPreviewContext) => void
    onNavigationChange?: (path: string) => void
    className?: string
}

const DRAWER_WIDTH = 310
const PREVIEW_LOADING_TIME = 3000

export const PreviewInterface: React.FC<PreviewInterfaceProps> = ({
    configuration,
    onContextChange,
    onNavigationChange,
    className = ''
}) => {
    const intl = useIntl()
    const [isDrawerOpen, setIsDrawerOpen] = useState(true)
    const [isFormSubmitting, setIsFormSubmitting] = useState(false)
    const [currentPath, setCurrentPath] = useState('/')
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const form = useForm<PreviewFormValues>({
        defaultValues: {
            sourceCode: '',
            customerGroupIds: '',
            date: null,
            time: '',
            device: 'desktop',
            customQualifiers: [{key: '', value: ''}]
        }
    })

    const navigationForm = useForm<{path: string}>({
        defaultValues: {
            path: '/'
        }
    })

    // Parse initial values from URL
    useEffect(() => {
        const params = parsePreviewParams(window.location.href)
        form.reset({
            sourceCode: params.sourceCode || '',
            customerGroupIds: params.customerGroupIds?.join(',') || '',
            date: params.effectiveDateTime ? new Date(params.effectiveDateTime) : null,
            time: params.effectiveDateTime ? new Date(params.effectiveDateTime).toTimeString().slice(0, 5) : '',
            device: params.device || 'desktop',
            customQualifiers: Object.entries(params.customQualifiers || {}).map(([key, value]) => ({key, value}))
        })
    }, [form])

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen)
    }

    const handlePreviewSubmit = async (data: PreviewFormValues) => {
        setIsFormSubmitting(true)

        try {
            // Build context from form data
            const context: PageDesignerPreviewContext = {
                sourceCode: data.sourceCode || undefined,
                customerGroupIds: data.customerGroupIds ? data.customerGroupIds.split(',').filter(Boolean) : [],
                customQualifiers: data.customQualifiers.reduce((acc, qualifier) => {
                    if (qualifier.key && qualifier.value) {
                        acc[qualifier.key] = qualifier.value
                    }
                    return acc
                }, {} as Record<string, string>),
                device: data.device
            }

            // Set effective date/time if provided
            if (data.date && data.time) {
                const dateTime = new Date(data.date)
                const [hours, minutes] = data.time.split(':')
                dateTime.setHours(parseInt(hours), parseInt(minutes))
                context.effectiveDateTime = dateTime.toISOString()
            }

            // Update iframe URL with new context
            const newUrl = buildPreviewUrl(configuration.previewUrl, context)
            if (iframeRef.current) {
                iframeRef.current.src = newUrl
            }

            // Send context change message
            sendContextChangeMessage(context)
            onContextChange?.(context)

            // Wait for loading to complete
            setTimeout(() => {
                setIsFormSubmitting(false)
            }, PREVIEW_LOADING_TIME)
        } catch (error) {
            console.error('Error updating preview context:', error)
            setIsFormSubmitting(false)
        }
    }

    const handleNavigationSubmit = (data: {path: string}) => {
        setCurrentPath(data.path)
        sendNavigationChangeMessage(data.path)
        onNavigationChange?.(data.path)
    }

    const handleIFrameLoad = () => {
                    // Send ready message when iframe loads
            if ((window as any).PAGE_DESIGNER_PREVIEW) {
                (window as any).PAGE_DESIGNER_PREVIEW.sendReadyMessage?.()
            }
    }

    return (
        <div className={`page-designer-preview-interface ${className}`}>
            {/* Toggle Button */}
            <button
                className="preview-toggle-button"
                onClick={toggleDrawer}
                aria-label={intl.formatMessage({
                    id: 'pageDesigner.preview.toggleButton',
                    defaultMessage: 'Toggle Preview Settings'
                })}
            >
                {isDrawerOpen ? '◀' : '▶'}
            </button>

            {/* Settings Drawer */}
            {isDrawerOpen && (
                <div className="preview-drawer" style={{width: DRAWER_WIDTH}}>
                    <div className="drawer-header">
                        <h3>
                            {intl.formatMessage({
                                id: 'pageDesigner.preview.title',
                                defaultMessage: 'Preview Settings'
                            })}
                        </h3>
                    </div>

                    <div className="drawer-content">
                        {/* Source Code */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.sourceCode',
                                    defaultMessage: 'Source Code'
                                })}
                            </label>
                            <Controller
                                name="sourceCode"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <input
                                        type="text"
                                        {...field}
                                        placeholder="Enter source code"
                                    />
                                )}
                            />
                        </div>

                        {/* Customer Groups */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.customerGroups',
                                    defaultMessage: 'Customer Groups'
                                })}
                            </label>
                            <Controller
                                name="customerGroupIds"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <input
                                        type="text"
                                        {...field}
                                        placeholder="Enter customer group IDs (comma-separated)"
                                    />
                                )}
                            />
                        </div>

                        {/* Date */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.date',
                                    defaultMessage: 'Date'
                                })}
                            </label>
                            <Controller
                                name="date"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <input
                                        type="date"
                                        {...field}
                                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                                    />
                                )}
                            />
                        </div>

                        {/* Time */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.time',
                                    defaultMessage: 'Time'
                                })}
                            </label>
                            <Controller
                                name="time"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <input
                                        type="time"
                                        {...field}
                                    />
                                )}
                            />
                        </div>

                        {/* Device */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.device',
                                    defaultMessage: 'Device'
                                })}
                            </label>
                            <Controller
                                name="device"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <select {...field}>
                                        {configuration.previewDevices.map(device => (
                                            <option key={device.id} value={device.id}>
                                                {device.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            />
                        </div>

                        {/* Custom Qualifiers */}
                        <div className="form-field">
                            <label>
                                {intl.formatMessage({
                                    id: 'pageDesigner.preview.customQualifiers',
                                    defaultMessage: 'Custom Qualifiers'
                                })}
                            </label>
                            <Controller
                                name="customQualifiers"
                                control={form.control}
                                render={({field}: {field: any}) => (
                                    <div>
                                        {field.value.map((qualifier: any, index: number) => (
                                            <div key={index} className="qualifier-row">
                                                <input
                                                    type="text"
                                                    placeholder="Key"
                                                    value={qualifier.key}
                                                    onChange={(e) => {
                                                        const newValue = [...field.value]
                                                        newValue[index].key = e.target.value
                                                        field.onChange(newValue)
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Value"
                                                    value={qualifier.value}
                                                    onChange={(e) => {
                                                        const newValue = [...field.value]
                                                        newValue[index].value = e.target.value
                                                        field.onChange(newValue)
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange([...field.value, {key: '', value: ''}])
                                            }}
                                        >
                                            Add Qualifier
                                        </button>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={form.handleSubmit(handlePreviewSubmit)}
                            disabled={isFormSubmitting}
                            className="preview-submit-button"
                        >
                            {isFormSubmitting ? 'Updating...' : 'Update Preview'}
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Bar */}
            <div className="preview-navigation">
                <form onSubmit={navigationForm.handleSubmit(handleNavigationSubmit)}>
                    <input
                        type="text"
                        placeholder="Enter path"
                        {...navigationForm.register('path')}
                    />
                    <button type="submit">Navigate</button>
                </form>
            </div>

            {/* Preview Iframe */}
            <iframe
                ref={iframeRef}
                src={configuration.previewUrl}
                className="preview-iframe"
                onLoad={handleIFrameLoad}
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        </div>
    )
}

export default PreviewInterface 