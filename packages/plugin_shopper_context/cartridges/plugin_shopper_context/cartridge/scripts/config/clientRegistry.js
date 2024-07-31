'use strict';
var { CLIENT_REGISTRY } = require('*/cartridge/scripts/config/constant');
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('plugin_shopper_context', 'plugin_shopper_context.constant');

/**
 * get the client registry for shopper context
 * @returns {Object} - client registry
 */
function getClientRegistry() {
    var test = CLIENT_REGISTRY;
    log.info('tst', CLIENT_REGISTRY);
    return CLIENT_REGISTRY;
}

module.exports = {
    getClientRegistry: getClientRegistry
};
