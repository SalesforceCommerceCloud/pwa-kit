/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
const {spawn, execFileSync} = require('child_process')
const {parse} = require('dotenv')

// Select only server-side Gateway settings; never copy the source environment file.
const source = process.env.LLM_GATEWAY_ENV_FILE
    ? parse(fs.readFileSync(process.env.LLM_GATEWAY_ENV_FILE))
    : {}
const appDirectory = path.resolve(__dirname, '..')
const localEnvFile = path.join(appDirectory, '.env')
const localEnv = fs.existsSync(localEnvFile) ? parse(fs.readFileSync(localEnvFile)) : {}
// The app's existing .env also supports shell-quoted multiline agent JSON.
// Read only that public configuration through the same shell syntax as npm start.
if (localEnv.COMMERCE_AGENT_SETTINGS && !process.env.COMMERCE_AGENT_SETTINGS) {
    localEnv.COMMERCE_AGENT_SETTINGS = execFileSync(
        '/bin/sh',
        ['-c', '. "$1"; printf "%s" "$COMMERCE_AGENT_SETTINGS"', 'pwa-local-config', localEnvFile],
        {encoding: 'utf8'}
    )
}
// Explicit process credentials override the app's local defaults.
const env = {...localEnv, ...process.env}
// Keep child CLI shebangs on the same supported Node runtime as this launcher.
env.PATH = `${path.dirname(process.execPath)}${path.delimiter}${env.PATH || ''}`
if (process.env.PWA_STORE_ENV_FILE) {
    const store = parse(fs.readFileSync(process.env.PWA_STORE_ENV_FILE))
    env.PWA_KIT_SLAS_CLIENT_SECRET =
        process.env.PWA_KIT_SLAS_CLIENT_SECRET || store.PWA_KIT_SLAS_CLIENT_SECRET
}

const gatewaySettings = [
    'LLM_GATEWAY_AUTH_MODE',
    'LLM_GATEWAY_URL',
    'LLM_GATEWAY_API_KEY',
    'LLM_GATEWAY_SFDC_CORE_TENANT_ID',
    'LLM_GATEWAY_MODEL',
    'LLM_GATEWAY_API_VERSION',
    'LLM_GATEWAY_CLIENT_FEATURE',
    'LLM_GATEWAY_APP_CONTEXT',
    'LLM_GATEWAY_ECA_TOKEN_URL',
    'LLM_GATEWAY_ECA_CLIENT_ID',
    'LLM_GATEWAY_ECA_CLIENT_SECRET',
    'LLM_GATEWAY_ECA_ORIGIN',
    'LLM_GATEWAY_ECA_MODEL',
    'LLM_GATEWAY_ECA_CLIENT_FEATURE',
    'LLM_GATEWAY_ECA_TENANT_ID',
    'LLM_GATEWAY_BM_TOKEN_URL',
    'LLM_GATEWAY_BM_AM_CLIENT_ID',
    'LLM_GATEWAY_BM_AM_CLIENT_SECRET'
]
for (const key of gatewaySettings) if (!env[key] && source[key]) env[key] = source[key]
Object.assign(env, {
    ENABLE_SEARCH_SUMMARY: 'true',
    NODE_ICU_DATA: env.NODE_ICU_DATA || 'node_modules/full-icu',
    LISTEN_ADDRESS: env.LISTEN_ADDRESS || 'localhost:3001',
    EXTERNAL_DOMAIN_NAME: env.EXTERNAL_DOMAIN_NAME || 'localhost:3001',
    NODE_USE_SYSTEM_CA: env.NODE_USE_SYSTEM_CA || '1'
})
const devPackage = require.resolve('@salesforce/pwa-kit-dev/package.json')
const devCli = path.resolve(path.dirname(devPackage), require(devPackage).bin['pwa-kit-dev'])
// Start the same CLI as npm start without a shell re-sourcing .env over supplied credentials.
const child = spawn(process.execPath, [devCli, 'start'], {cwd: appDirectory, env, stdio: 'inherit'})
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal))
child.on('exit', (code) => process.exit(code || 0))
