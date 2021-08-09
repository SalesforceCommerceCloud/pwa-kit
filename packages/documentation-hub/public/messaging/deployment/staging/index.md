With the alias set up in the [requirements](../requirements/) documentation, run the following command to deploy your assets to a staging environment:

```c
$ with_aws bash
bash$ grunt deploy:staging
```

On client site, please make sure this cookie is set by running this command in console.

```javascript
document.cookie = 'mobify_webpush_bundle=staging; path=/';
```

Once deployed, please follow the [Testing documentations](../../testing/).

**Important**: There are some changes that cannot be tested on staging. Please refer to [What cannot be tested on Staging documentation](../../testing/no-test-on-staging/).

## Clearing Staging Cookie

Sometimes, the staging cookie may persist on Mobify-hosted site even if you clear your cookies a million times. When this happens, visit the following url:

-   `https://webpush-cdn.mobify.net/setbundle.gif`
-   `https://webpush.mobify.net/setbundle.gif`
