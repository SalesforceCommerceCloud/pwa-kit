/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Button } from './button';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((
        message: string, 
        type: Toast['type'] = 'info', 
        duration: number = 5000
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        const toast: Toast = { id, message, type, duration };
        
        setToasts(prev => [...prev, toast]);
        
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

function ToastContainer({ 
    toasts, 
    onRemove 
}: { 
    toasts: Toast[]; 
    onRemove: (id: string) => void; 
}) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ 
    toast, 
    onRemove 
}: { 
    toast: Toast; 
    onRemove: (id: string) => void; 
}) {
    const getToastStyles = () => {
        const baseStyles = "flex items-center justify-between p-4 rounded-lg shadow-lg max-w-sm w-full";
        
        switch (toast.type) {
            case 'success':
                return `${baseStyles} bg-green-600 text-white`;
            case 'error':
                return `${baseStyles} bg-red-600 text-white`;
            case 'info':
            default:
                return `${baseStyles} bg-blue-600 text-white`;
        }
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center">
                <div className="mr-3">
                    {toast.type === 'success' && '✓'}
                    {toast.type === 'error' && '✕'}
                    {toast.type === 'info' && 'ℹ'}
                </div>
                <span className="text-sm font-medium">{toast.message}</span>
            </div>
            
            <Button
                onClick={() => onRemove(toast.id)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-black/20 h-6 w-6 p-0"
            >
                ✕
            </Button>
        </div>
    );
}
