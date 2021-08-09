## Non-progressive (non-mobile) Support <a name="non-progressive" href="#non-progressive">#</a>

When you generate a PWA project with the Mobify Platform, you will also
get support for deploying some platform features, such as [Push Messaging](../../push-messaging),
on a range of non-mobile browsers where the PWA doesn't load. This is 
called _non-progressive mode_. Files and variables associated with
it are named `non-pwa` or `nonPWA`.

### The non-PWA script <a name="non-pwa-script" href="#non-pwa-script">#</a>

On a mobile browser, the loader.js script sets up
the Progressive Web App. On a browser that doesn't load the PWA, the same
loader will load the file `web/non-pwa/non-pwa.js` (the _non-pwa_ filename
is because this script is run instead of a PWA).

This script initializes and configures the features of the Mobify Platform that
are supported on browsers that don't run the PWA. Currently, it supports
Mobify Push Messaging. See the [instructions on how to configure Messaging for
non-progressive mode](../../push-messaging/configuration#non-progressive).

You can add your own custom logic to the `non-pwa.js` script, if you need it to
execute when the PWA doesn't load. Include it in the `init` function of the
script.

