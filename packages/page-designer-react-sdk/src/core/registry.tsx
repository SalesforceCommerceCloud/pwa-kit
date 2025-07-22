// Remove the import React from 'react'; line if present.

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

export interface ComponentInput {
    name: string
    type: InputType
    defaultValue?: any
    allowedFileTypes?: string[] // for "file" types
    helperText?: string
}

export interface AttributeDefinition {
    description: string
    id: string
    name: string
    required?: boolean
    type: string
}

export interface AttributeDefinitionGroup {
    attribute_definitions: AttributeDefinition[]
    description?: string
    id: string
    name: string
}

export interface ComponentConfig {
    name: string
    inputs?: ComponentInput[]
    canHaveChildren?: boolean
    category?: string
    icon?: string
    id?: string
    description?: string
    image_url?: string
    attribute_definition_groups?: AttributeDefinitionGroup[]
}

export interface RegisteredComponent {
    config: ComponentConfig
}

const registry = new Map<string, RegisteredComponent>()

function broadcastComponentRegister(config: ComponentConfig) {
    console.log(`[PD] Registered component: ${config.name}`)
        window.parent.postMessage(
            {
                mType: 'builder-register-component',
                mBody: config
            },
            '*'
        )
}

export const PD = {
    registerComponent(config: ComponentConfig) {
        if (registry.has(config.name)) {
            console.warn(`[PD] Component "${config.name}" already registered. Skipping.`)
            return
        }

        registry.set(config.name, {
            config
        })

        broadcastComponentRegister(config)
    },

    getRegistry(): RegisteredComponent[] {
        return Array.from(registry.values())
    },

    getComponentByName(name: string): RegisteredComponent | undefined {
        return registry.get(name)
    }
}

// Respond to PD_REQUEST_COMPONENTS with all registered component configs
export function setupComponentRegistryMessaging() {
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
