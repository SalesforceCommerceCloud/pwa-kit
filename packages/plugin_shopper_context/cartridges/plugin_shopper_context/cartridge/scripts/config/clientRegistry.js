'use strict';

// Implementations can override this module to provide their own registry of clients and their allowed attributes.

var CLIENT_REGISTRY = {
    '574cf8f6-8536-4a39-acbb-8e7f1759f901': {
        allowSourceCode: true,
        allowCustomerGroupIds: false,
        allowEffectiveDateTime: false,
        allowCustomQualifiers: false,
        allowAssignmentQualifiers: false
    }
};

/**
 * get the client registry for shopper context
 * @returns {Object} - client registry
 */
function getClientRegistry() {
    return CLIENT_REGISTRY;
}

module.exports = {
    getClientRegistry: getClientRegistry
};
