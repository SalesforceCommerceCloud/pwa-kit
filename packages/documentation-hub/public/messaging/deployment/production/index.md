Once the project assets have been [deployed to staging](../staging/), you can run
the following command to deploy to production.

```c
$ with_aws bash
bash$ grunt deploy:production
```

Compared to staging, deploying to production includes two additional files:

-   `<site-id>.yaml`: The configuration file used by the backend system
-   `web.*.cer`: A certificate to enable push notifications for Safari

The certificate should exist within the root folder before deploying to production.

On client site, make sure `mobify_webpush_bundle` cookie is **not present**.

Once deployed, please follow the [Testing documentations](../../testing/).

## Test on production

Sometimes, it is desired to test the Web Push features on the production environment, especially when there are features that cannot be tested on the staging environment. Follow the steps below to ensure the feature is not accessible to the public while testing.

1.  Within the `<site_id>.yaml` configuration file `splits` value, change `enabled` to `false` for all entries to disable Web Push.
For example:
```yaml
splits:
    - min: 1
      max: 100
      name: webpush-disabled
      enabled: false
      description: Disable webpush on all page visits
```
1.  Upload the .yaml configuration file to S3
```sh
aws s3 cp ./<site-id>.yaml s3://webpush-custom/<site-id>/
```

  **Important**: This is the production configuration, which means if you set the split flags to true, the opt-in banner will be visible to the public. If you want to test on a production environment, make sure each split has `enabled` set to `false`.

  Note: If you did not set up the AWS environment, follow the instructions at [Setup Requirement](../requirements/).

  To install the AWS command line tools, follow the instructions at [Install AWS cli](http://docs.aws.amazon.com/cli/latest/userguide/installing.html).

1.  Upload bundles

  You can make your changes to the configuration files and the banner styling at this time. Then run the following command in the project folder.
```sh
mobify-push upload
```
This command will upload a bundle folder to `s3://webpush-custom/<site_id>/<bundle_id>/`, this folder is for testing purpose and you can view your changes on the production by change your cookie value.

1.  Manage web push states

  Mobify Web Push Notifications uses cookies to manage its state. Cookies are prefixed with `mobify.webpush.` and are stored on the domain of hosting website.

  `mobify.webpush.bundle.<site_id>` is used for developing and testing, change the value to `<bundle_id>` on the production site to test your changes, i.e.:

  ```c
  document.cookie = 'mobify.webpush.bundle.<site_id> = <bundle_id>'
  ```


## Enable push notifications

To enable notifications on production, please contact your Mobify project manager.

### Instructions (for Mobify staff)

1.  Log in to Cloud PBJT and either create a new project or open an existing one.
1.  Scroll down to the **Feature Flags** section
1.  Select **messaging** in the drop down
1.  Enter the following in the **Config** text area:


    {
      "site_id": "site-id"
    }

An example of this, if the site id was merlinspotion:

    {
        "site_id": "merlinspotion"
    }

**Important**: To see this section in Cloud PBJT, you'll need admin access. For people who don't have admin
access, you'll need to find someone who does.
