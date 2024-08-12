'use strict';
var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();
var multiSiteSupportEnabled =
    currentSite.getCustomPreferenceValue('supportMultiSite');
// Implementations can override this module to provide their own registry of clients and their allowed attributes.
var CLIENT_REGISTRY = {
    '574cf8f6-8536-4a39-acbb-8e7f1759f901': {
        allowSourceCode: true,
        allowCustomerGroupIds: false,
        allowEffectiveDateTime: false,
        allowCustomQualifiers: true,
        allowAssignmentQualifiers: false,
        allowClientIp: false,
        allowGeoLocation: false
    },
    'e7e22b7f-a904-4f3a-8022-49dbee696485': {
        allowSourceCode: true,
        allowCustomerGroupIds: false,
        allowEffectiveDateTime: false,
        allowCustomQualifiers: true,
        allowAssignmentQualifiers: false,
        allowClientIp: false,
        allowGeoLocation: false
    },
    '99b4e081-00cf-454a-95b0-26ac2b824931': {
        allowSourceCode: true,
        allowCustomerGroupIds: false,
        allowEffectiveDateTime: false,
        allowCustomQualifiers: true,
        allowAssignmentQualifiers: false,
        allowClientIp: false,
        allowGeoLocation: false
    }
};

module.exports = {
    CLIENT_REGISTRY: CLIENT_REGISTRY,
    SHORT_CODE: 'kv7kzm78',
    ORGID: 'f_ecom_bdpx_dev'
};
