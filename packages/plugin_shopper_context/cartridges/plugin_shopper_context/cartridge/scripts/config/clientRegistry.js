'use strict';

// Implementations can override this module to provide their own registry of clients and their allowed attributes.
var { CLIENT_REGISTRY } = require('*/cartridge/scripts/config/constant');
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
