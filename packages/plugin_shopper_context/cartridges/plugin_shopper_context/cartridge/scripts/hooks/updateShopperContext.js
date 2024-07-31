'use strict';

/* global request */
var Status = require('dw/system/Status');
var { validateContext } = require('*/cartridge/scripts/helpers/utils');
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('plugin_shopper_context', 'plugin_shopper_context.beforePATCH');

exports.beforePATCH = function (usid, siteId, shopperContext) {
    var clientId = request.clientId;
    if (!validateContext(clientId, shopperContext)) {
        const invalidContextMsg = 'Invalid context property found.';
        log.error(invalidContextMsg);
        var status = Status.ERROR;
        return new Status(status);
    }

    return new Status(Status.OK);
};
