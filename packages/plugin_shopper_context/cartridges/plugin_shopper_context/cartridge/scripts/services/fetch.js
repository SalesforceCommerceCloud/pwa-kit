'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var HTTPClient = require('dw/net/HTTPClient');
var Bytes = require('dw/util/Bytes');
var StringUtils = require('dw/util/StringUtils');
var CaseInsensitiveMap = require('*/cartridge/scripts/models/CaseInsensitiveMap');

/**
 * @typedef {Object} Options
 * @property {string} method - Request method. Defaults to GET
 * @property {Object} headers - An object containing key/value pairs representing HTTP headers
 * @property {Object} queryParameters - An object containing key/value pairs representing query parameters
 * @property {Object} body - The request body. Fetch assumes the body is JSON by default
 * @property {number} timeout - Sets the request timeout in milliseconds
 * @property {boolean} useCredentials - A boolean that determines whether a service's credentials (defined in business manager) should be used.
 * @property {Function} onCredentials - A callback function that defines how service credentials are used by this fetch call
 */

/**
 * @typedef {Object} Response
 * @property {string} body - Response body
 * @property {string} headers - Response header
 * @property {boolean} ok - True if the response is HTTP 2xx
 * @property {string} status - Response status code
 * @property {string} statusText - Response status code description
 * @property {string} url - The url the response is from
 * @property {string} errorText - Error message. Null if the response succeeds.
 */

/**
 * @typedef {Object} ResultError
 * @property {number} error - An error-specific code if applicable.
 * @property {string} errorMessage - An error message on a non-OK status.
 * @property {string} msg - An extra error message on failure (if any).
 * @property {string} status - The status. Failure codes include "ERROR" and "SERVICE_UNAVAILABLE".
 *   If the status is "SERVICE_UNAVAILABLE", then the unavailableReason is guaranteed to be non-null.
 * @property {string} unavailableReason - The reason the status is SERVICE_UNAVAILABLE.
 */

var FILTER_KEYS = [
    'access_token',
    'authorization',
    'idp_access_token',
    'client_id',
    'client_secret',
    'x-client-ip'
];

/**
 * Helper function for identifying an element can be iterated
 * @param {Object} element - input element
 * @returns {boolean} true if object can be iterated
 */
function isIterable(element) {
    if (!element) return false;
    return (
        element.constructor === Array ||
        element.constructor === Object ||
        element.constructor === 'dw.net.HTTPClient' // Response objects have this as their constructor
    );
}

/**
 * Helper function for itetrating an element with a function
 * @param {Object} iterable - input element
 * @param {Function} functionRef - function to apply
 */
function forEachIn(iterable, functionRef) {
    Object.keys(iterable).forEach(function (key) {
        functionRef(key, iterable[key]);
    });
}

/**
 * Helper function for traversing a json and masking values for FILTER_KEYS
 * @param {Object} object - input object
 * @returns {Object} object with masked properties
 */
function sanitizeHeaderResponse(object) {
    if (isIterable(object)) {
        forEachIn(object, function (key, value) {
            if (key !== null) {
                // In HTTPClient's Response object, the body in response.text is something we want to filter
                if (key === 'text' && object[key] != null) {
                    var nestedBody = JSON.parse(object[key]);
                    var filteredBody = sanitizeHeaderResponse(nestedBody);
                    value = JSON.stringify(filteredBody); // eslint-disable-line no-param-reassign
                    object[key] = value; // eslint-disable-line no-param-reassign
                } else if (
                    FILTER_KEYS.indexOf(String(key).toLowerCase()) > -1
                ) {
                    value = '*****'; // eslint-disable-line no-param-reassign
                    object[key] = value; // eslint-disable-line no-param-reassign
                }
            }
            sanitizeHeaderResponse(value);
        });
    }
    return object;
}

/**
 * Helper function for converting an object into a query string
 * @param {Object} object - input object containing query parameters.
 * @returns {string} querystring
 */
function encodeToString(object) {
    if (!object) {
        return '';
    }
    var encodedString = '';
    Object.keys(object).forEach(function (key) {
        var value = encodeURIComponent(object[key]);
        if (encodedString) encodedString += '&';
        encodedString += key + '=' + value;
    });
    return encodedString;
}

/**
 * Helper function for converting a queryString into an object
 * @param {string} queryString a query string
 * @returns {Object} deserialized object representation of the query string
 */
function deserializeQueryString(queryString) {
    var str = queryString.replace('?', '');
    var deserializedObject = {};
    var queryPairs = str.split('&');
    queryPairs.forEach(function (pair) {
        var parts = pair.split('=');
        var key = parts[0];
        var value = parts.length > 1 ? parts[1] : null;
        deserializedObject[key] = value;
    });
    return deserializedObject;
}

/**
 * Helper function for throwing an error. Handles http errors and service errors
 * @param {Object} errorObject - An object containing information about the error
 */
function throwError(errorObject) {
    var error = {
        type: errorObject.type,
        status: errorObject.status,
        statusText: errorObject.statusText,
        message: errorObject.message
    };
    if (errorObject.errorCode) {
        error.errorCode = errorObject.errorCode;
    }
    if (errorObject.errorMessage) {
        error.errorMessage = errorObject.errorMessage;
    }
    if (errorObject.description) {
        error.description = errorObject.description;
    }
    throw new Error(JSON.stringify(error));
}

/**
 * Helper function for throwing an HTTP error given a Fetch Response object
 * @param {Object} response - Response from fetch()
 * @param {string} description - Additional description about the error
 */
function throwHttpError(response, description) {
    var error = {
        type: 'HTTP',
        status: response.status,
        statusText: response.statusText
    };
    if (response.errorText) {
        error.message = response.errorText;
    }
    if (description) {
        error.description = description;
    }

    throwError(error);
}

/**
 * Describes what happens inside service.call()
 *
 * This initiates a custom HTTP client that does not automatically follow redirects.
 * Assumes that the ServiceType in business manager is set to Generic
 *
 * See https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_svc_ServiceCallback.html
 * @returns {dw.svc.ServiceCallback} returns service instance
 */
function generateServiceCallback() {
    return {
        execute: function (service, params) {
            var client = new HTTPClient();
            var serviceOptions = params[0];

            // TODO - If we make this configurable we probably want a redirected property in our response object
            client.setAllowRedirect(false);
            client.setTimeout(serviceOptions.timeout);
            service.client = client;

            client.open(serviceOptions.method, service.getURL());

            Object.keys(serviceOptions.headers).forEach(function (key) {
                var value = serviceOptions.headers[key];
                client.setRequestHeader(key, value);
            });

            if (serviceOptions.body) {
                client.sendBytes(new Bytes(params[0].body));
            } else {
                client.send();
            }

            return client;
        },
        parseResponse: function (service, response) {
            return response;
        },
        // Filters the request and responses that get logged in communication logs
        filterLogMessage: function (msg) {
            try {
                var logObj = JSON.parse(msg);
                var result = sanitizeHeaderResponse(logObj);
                return result ? JSON.stringify(result) : msg;
            } catch (e) {
                // We end up here after Fetch calls service.setUrl
                // The message is a URL and may contain things like the client_id so we don't return it
                return '';
            }
        },
        // mocks the execute function. To be implemented
        mockCall: function () {}
    };
}

/**
 * A fetch-like API for making calls through the service framework.
 *
 * This function takes in an options object where the following additional configuration is available:
 * method - sets the type of HTTP request. Defaults to GET
 * queryParameters - an object containing key/value pairs representing query parameters that will be appended to the path
 * headers - an object containing key/value pairs representing HTTP headers
 * body - the request body. Assumes the provided object is serialized to JSON
 * timeout - sets the request timeout in milliseconds. Timeout defined in the service profile takes precidence over what is provided via this option.
 *  A default timeout defined in SLASConfig is applied if there is no timeout defined in the profle and no timeout option is provided.
 * useCredentials - a boolean that determines whether a service's credentials should be used.
 *  The credentials are defined in business manager. Setting this to true overwrites the authentication header.
 * onCredentials - a callback function that defines how service credentials are to be used by this call
 *
 * @param {string} serviceName - name of the service from which credentials are defined
 * @param {string} url - the URL we are making a fetch request to
 * @param {Options} options - configuration options. See above for available options
 * @returns {Response} The response object
 */
function fetch(serviceName, url, options) {
    // Clone options since we make mutations to it. No modifications are made to child objects
    var serviceParameters = {};
    if (options) {
        Object.keys(options).forEach(function (key) {
            var value = options[key];
            serviceParameters[key] = value;
        });
    }

    serviceParameters.url = url;
    serviceParameters.method = serviceParameters.method || 'GET';
    serviceParameters.headers = serviceParameters.headers || {};
    serviceParameters.queryParameters = serviceParameters.queryParameters || {};

    if (
        (serviceParameters.method === 'GET' ||
            serviceParameters.method === 'HEAD') &&
        serviceParameters.body
    ) {
        throw new TypeError(
            'Unexpected request body found in ' +
                serviceParameters.method +
                ' request'
        );
    }

    var service = LocalServiceRegistry.createService(
        serviceName,
        generateServiceCallback()
    );

    var serviceConfiguration = service.getConfiguration();
    if (serviceConfiguration.getServiceType() !== 'GENERIC') {
        throw new TypeError(
            'Service ' +
                serviceName +
                ' is not of type GENERIC. The service type must be GENERIC in Business Manager.'
        );
    }

    // eslint advised to use Number.isNaN, but it is es6, cartridge code is using older version of ECMA.
    // eslint-disable-next-line
    if (isNaN(serviceParameters.timeout)) {
        var serviceProfile = serviceConfiguration.getProfile();
        if (serviceProfile && serviceProfile.getTimeoutMillis()) {
            serviceParameters.timeout = serviceProfile.getTimeoutMillis();
        } else {
            serviceParameters.timeout = 5000;
        }
    }

    var credentials = serviceConfiguration.getCredential();
    if (serviceParameters.useCredentials && credentials) {
        serviceParameters.headers.authorization =
            'Basic ' +
            StringUtils.encodeBase64(
                [credentials.user, credentials.password]
                    .filter(Boolean)
                    .join(':')
            );
    }
    if (serviceParameters.onCredentials && credentials) {
        serviceParameters.onCredentials(serviceParameters, credentials);
    }

    if (serviceParameters.body) {
        if (
            serviceParameters.headers['Content-Type'] ===
            'application/x-www-form-urlencoded'
        ) {
            serviceParameters.body = encodeToString(options.body);
        } else {
            serviceParameters.body = JSON.stringify(options.body);
        }
    }

    var queryString = encodeToString(serviceParameters.queryParameters);
    if (queryString) {
        if (serviceParameters.url.split('?')[1]) {
            serviceParameters.url += '&' + queryString;
        } else {
            serviceParameters.url += '?' + queryString;
        }
    }

    service.setURL(serviceParameters.url);
    var result = service.call(serviceParameters);

    // Service framework wraps the response in a Result wrapper.
    // See https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_svc_Result.html
    // If result is not ok then there was a service / network level error.
    // We are guaranteed to have a result object if the result.ok is true
    // Note that result will be OK for non-200 HTTP responses
    if (!result.ok) {
        var error = {
            type: 'Service',
            status: result.status
        };
        if (result.status === 'SERVICE_UNAVAILABLE') {
            error.statusText = result.unavailableReason;
        } else if (result.status === 'ERROR') {
            error.errorCode = result.error;
            error.errorMessage = result.errorMessage;
        }
        error.message = result.msg;
        throwError(error);
    }

    var resultObject = result.object;

    var normalizedHeaders = CaseInsensitiveMap.getCaseInsensitiveMap(
        resultObject.responseHeaders
    );

    var response = {
        body: resultObject.text,
        headers: normalizedHeaders,
        ok: resultObject.statusCode >= 200 && resultObject.statusCode < 300,
        status: resultObject.statusCode,
        statusText: resultObject.statusMessage,
        url: serviceParameters.url,
        errorText: resultObject.errorText
    };

    return response;
}

module.exports = {
    fetch: fetch,
    deserializeQueryString: deserializeQueryString,
    encodeToString: encodeToString,
    throwHttpError: throwHttpError
};
