If you encounter situation that is not listed here, please [report your issue](https://github.com/mobify/grunt-init-webpush/issues/).

## General

**Issue**: I can see push messages, but there is no icon displayed next to the message.

**Cause**: There's something wrong with the `default_icon_url` value in the site settings.

**Fix**: Make sure the setting is set properly and the icon exists at the specified URL.

* * *

## Browser console output

**Issue**: `GET https://webpush.mobify.net/api/v1/clients/eefa7eb315c8ee17/<site-id>/ 404 (NOT FOUND)`

**Cause**: This is expected in the unsubscribed scenario.

**Fix**: N/A

* * *

**Issue**: `GET https://clarisonic.webnotify.me/service-worker.js?site_id=clarisonic&version=2.1.1.1&hash=2d8be60f net::ERR_FILE_EXISTS`

**Cause**: This happens because we re-register an identical service worker, which we do in a number of places, just in case.

**Fix**:

* * *

**Issue**: `XMLHttpRequest cannot load https://webpush.mobify.net/api/v1/events/clarisonic/61f6027b42d1d703/. Origin http://www.clarisonic.com is not allowed by Access-Control-Allow-Origin.`

**Cause**:

**Fix**:
