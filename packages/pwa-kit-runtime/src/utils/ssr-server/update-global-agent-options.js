/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const AGENT_OPTIONS_TO_COPY = [
    'ca',
    'cert',
    'ciphers',
    'clientCertEngine',
    'crl',
    'dhparam',
    'ecdhCurve',
    'honorCipherOrder',
    'key',
    'passphrase',
    'pfx',
    'rejectUnauthorized',
    'secureOptions',
    'secureProtocol',
    'servername',
    'sessionIdContext'
]

/**
 * Given an https.Agent (or an http.Agent) and the corresponding globalAgent,
 * copy key fields from the options of the 'from' Agent to the
 * options of the 'to' Agent. If 'from' is undefined, this function does nothing.
 *
 * The fields that we update are:
 * ca, cert, ciphers, clientCertEngine, crl, dhparam, ecdhCurve,
 * honorCipherOrder, key, passphrase, pfx, rejectUnauthorized,
 * secureOptions, secureProtocol, servername, sessionIdContext
 *
 * @private
 * @param [from] {Agent} - source object (or undefined)
 * @param to {Agent} - target object
 */
export const updateGlobalAgentOptions = (from, to) => {
    if (from && to && from.options) {
        if (!to.options) {
            to.options = {}
        }
        AGENT_OPTIONS_TO_COPY.forEach((key) => {
            if (key in from.options) {
                to.options[key] = from.options[key]
            }
        })
    }
}
