'use strict';

/* global request */
var Status = require('dw/system/Status');
var { validateContext } = require('*/cartridge/scripts/helpers/utils');
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('plugin_slas', 'plugin_slas.config');

exports.beforePUT = function (usid, siteId, shopperContext) {
    var clientId = request.clientId;
    if (!validateContext(clientId, shopperContext)) {
        const invalidContextMsg = 'Invalid context property found.';
        log.error(invalidContextMsg);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
};
