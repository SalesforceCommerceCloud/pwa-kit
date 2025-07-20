import React from 'react'

export type InputType =
    | 'text'
    | 'number'
    | 'boolean'
    | 'file'
    | 'object'
    | 'array'
    | 'url'
    | 'color'
    | 'richText'
    | 'date'
    | 'element'

export interface AttributeDefinition {
    /** Human-readable description of the attribute */
    description: string
    /** Unique identifier for the attribute */
    id: string
    /** Attribute display name */
    name: string
    /** Whether the attribute is required */
    required?: boolean
    /** Attribute type (e.g. string, number, boolean, etc.) */
    type: string
}

export interface AttributeDefinitionGroup {
    /** List of attribute definitions in this group */
    attribute_definitions: AttributeDefinition[]
    /** Optional description of the group */
    description?: string
    /** Unique identifier for the group */
    id: string
    /** Group display name */
    name: string
}

export interface ComponentInput {
    /** Input name (used as prop key) */
    name: string
    /** Input type (e.g. string, number, boolean, array, object) */
    type: string
    /** Optional default value */
    defaultValue?: any
    /** Whether the input is required */
    required?: boolean
    /** Optional helper text for the UI */
    helperText?: string
}

export interface ComponentConfig {
    /** Component name (e.g. "Breadcrumbs") */
    name: string
    /** Optional inputs/props accepted by the component */
    inputs?: ComponentInput[]
    /** Whether the component can have children (e.g. slot content) */
    canHaveChildren?: boolean
    /** Optional category grouping (e.g. "Navigation", "Media") */
    category?: string
    /** Optional icon name or URL */
    icon?: string
    /** Optional unique identifier for internal use */
    id?: string
    /** Optional description of the component */
    description?: string
    /** Optional preview image URL shown in the visual editor */
    image_url?: string
    /** Optional list of grouped attribute definitions (e.g. for business logic or CMS integration) */
    attribute_definition_groups?: AttributeDefinitionGroup[]
}

type RegisteredComponent = {
    config: ComponentConfig
    component: React.ComponentType<any>
}

const registry = new Map<string, RegisteredComponent>()

// Helper to check if in design mode and in iframe
function isDesignModeActive() {
    try {
        return (
            typeof window !== 'undefined' &&
            window.self !== window.top &&
            window.location.search.includes('design=true')
        )
    } catch {
        return false
    }
}

function broadcastComponentRegister(config: ComponentConfig) {
    window.postMessage(
        {
            type: 'PD_COMPONENT_REGISTER',
            payload: config
        },
        '*'
    )
}

export const PD = {
    registerComponent(config: ComponentConfig, component: React.ComponentType<any>) {
        if (registry.has(config.name)) {
            console.warn(`[PD] Component "${config.name}" already registered. Skipping.`)
            return
        }

        registry.set(config.name, {
            config,
            component
        })

        broadcastComponentRegister(config)
        console.log(`[PD] Registered component: ${config.name}`)
    },

    getRegistry(): Record<string, React.ComponentType<any>> {
        const result: Record<string, React.ComponentType<any>> = {}
        for (const {config, component} of registry.values()) {
            result[config.name] = component
        }
        return result
    },

    getComponentByName(name: string): RegisteredComponent | undefined {
        return registry.get(name)
    },

    getComponentConfigList(): ComponentConfig[] {
        return Array.from(registry.values()).map((r) => r.config)
    }
}

// Respond to PD_REQUEST_COMPONENTS with all registered component configs
export function setupComponentRegistryMessaging() {
    if (!isDesignModeActive()) return
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'PD_REQUEST_COMPONENTS') {
            window.parent.postMessage(
                {
                    type: 'PD_RESPONSE_COMPONENTS',
                    payload: Array.from(registry.values()).map((r) => r.config)
                },
                '*'
            )
        }
    })
}
