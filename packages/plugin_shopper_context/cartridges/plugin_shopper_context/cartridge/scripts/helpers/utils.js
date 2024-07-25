'use strict';

var { ALLOW_UNKNOWN_CLIENTS } = require('*/cartridge/scripts/config/constant');

var {
    getClientRegistry
} = require('*/cartridge/scripts/config/clientRegistry');

/**
 * @typedef {Object} ShopperContext
 * @property {string} sourceCode
 * @property {string[]} customerGroupIds
 * @property {string} effectiveDateTime
 * @property {Object} customQualifiers
 * @property {Object} assignmentQualifiers
 */

/**
 * Validates the given shopper context object against the client registry.
 * @param {string} clientId - client id to be validated against
 * @param {ShopperContext} shopperContext - shopper context to be validated
 * @return {boolean} - validation status
 */
function validateContext(clientId, shopperContext) {
    const clientRegistry = getClientRegistry();

    if (!clientRegistry[clientId]) {
        // client not in the registry
        // this means there will be no constraint on shopper context. Use this with caution if you
        // are using shopperJWT to set context
        return ALLOW_UNKNOWN_CLIENTS;
    }

    const clientRules = clientRegistry[clientId];
    // validate shopperContext against the allowed attributes
    if (!clientRules.allowSourceCode && shopperContext.sourceCode) {
        return false;
    }
    if (!clientRules.allowCustomerGroupIds && shopperContext.customerGroupIds) {
        return false;
    }
    if (
        !clientRules.allowEffectiveDateTime &&
        shopperContext.effectiveDateTime
    ) {
        return false;
    }
    if (!clientRules.allowCustomQualifiers && shopperContext.customQualifiers) {
        return false;
    }
    if (
        !clientRules.allowAssignmentQualifiers &&
        shopperContext.assignmentQualifiers
    ) {
        return false;
    }

    return true;
}

module.exports = {
    validateContext: validateContext
};
