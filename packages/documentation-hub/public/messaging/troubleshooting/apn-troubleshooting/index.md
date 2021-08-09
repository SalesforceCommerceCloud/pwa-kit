Since Safari push is very different from the W3C standard push in the
other browsers, it needs different troubleshooting steps.

If Safari directly redirects back from the hard ask without showing the permissions dialog, most likely there is a configuration problem that prevents generating the correct information for Safari push. Follow these steps to make sure the configuration is free of the most common issues.

If the correct icon does not show in push messages, follow the steps
starting with step 3.

## 1: Verify the certificate

Check in the custom content folder on S3 with

```c
s3cmd ls s3://webpush-custom/<site-id>/
```

There should be a file in that directory named `<apn_certificate_name>.pem` matching `<apn_certificate_name>` in the site configuration. If not, re-obtain the certificate from Apple and put it in the directory, then try again.

## 2: Check the configuration variables

The site configuration needs to have a `friendly_site_name` value configured to work on Safari. This is the name used in the Safari system dialog to describe the site and is required for the dialog to operate correctly.

If the site is customer-hosted, the `apn_backend_hostname` value must be set to a Mobify domain, usually `<site_id>.webnotify.me`, so that Safari will request the push information from the correct server.

## 3: Make sure there is an icon

Check for a file called `icon256x256.png` with

```c
s3cmd ls s3://webpush-custom/<site-id>/production/images
```

If the file is missing, obtain a copy of the (correctly-sized) icon and upload it to S3 before trying again.

## 4: Ensure that the icon is correctly sized

Download the icon file with

```c
s3cmd get s3://webpush-custom/<site-id>/production/images/icon256x256.png icon256x256.png
```

Open it and make sure it is exactly 256x256 pixels. If not, obtain a correctly sized icon and replace the incorrect one.

## 5: Re-encode the icon

If the icon is the correct size, it may be encoded in a way that the backend does not understand. Confirm with a designer that the icon was generated with standard Mobify tooling, and open and re-export the icon if it was not.

## 6: Check the logs

At this point, we have ensured that the error is not one of the most common ones that we have encountered. Search the Pusheen logs for `log_from_apn` and follow up on what is found there, escalating if necessary.
