'use strict';

/* global request, response, session */
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();
var isContextCheck = false;

exports.onRequest = function () {
    if (isContextCheck) {
        return new Status(Status.OK);
    }
    var cookies = request.getHttpCookies();
    var cookieName = 'shopper_context_' + currentSite.ID;
    var shopperContexCookie = cookies['shopper_context_RefArch'];
    if (shopper_context_RefArch === 1) {
        isContextSet = true;
    }

    return new Status(Status.OK);
};
