
Setting Up Storefront Preview:

Pre-work:

Ensure Runtime Admin UI is updated to with the correct csp headers and ALLOWED_ORIGINS.

Steps:

1. Get API key for runtime admin instance. ✅
2. Create a new project in runtime admin. NOTE: The project id is scaffold-pwa so it's required to create the project as Scaffold PWA, then rename to PWA Kit.
   a. Assign Users
   b. Update Project Settings
3. Update "Production" environment settings from prod runtime admin. NOTE: UI I missing "site ids" section so I cannot set to production.
   CC_SHORT_CODE: kv7kzm78
   MARKETING_CLOUD_SUBDOMAIN: mcsmrlv0frbyjcvr04f14448lbd4
   MARKETING_CLOUD_PASSWORDLESS_LOGIN_TEMPLATE: passwordless_login
   MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE: reset_password
   MARKETING_CLOUD_CLIENT_ID: szz7x9sj5elk2usakfu55gls
   MARKETING_CLOUD_CLIENT_SECRET: 1Xs1LMFrR4SXYG8oad0j3sJN
   NON_EXIST_ENV_VAR: 
   PWA_KIT_SLAS_CLIENT_SECRET: 8ZHFqG2sLiGwz0PgE-E5kJjQS_uEeEvwLJbjsxkXJxw
   SLAS_PRIVATE_CLIENT_ID: 083859f2-5d93-4209-b999-a112266d63a0
   SLAS_PRIVATE_CLIENT_SECRET: 8ZHFqG2sLiGwz0PgE-E5kJjQS_uEeEvwLJbjsxkXJxw
   STOREFRONT_PREVIEW_DEBUG: 0
4. Push a new storefront build to the environment. using --cloud-origin flag. 

```
npm run push -- -m 'Initial Push' -c ~/.mobify--ecom-dev -s scaffold-pwa -t production --cloud-origin=https://managed-runtime-backend048.sfdc-3vx9f4.svc.sfdcfc.net
```

5. Update Callback URL and Redirect URI for API client.
6. Update config/default.js to use the correct client id and organization id.
7. Update the CSP and iframe allow list. In the following files:
   a. https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/commerce-sdk-react/src/constant.ts (iframe allow list)
   b. https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/pwa-kit-runtime/src/utils/middleware/security.js (csp)
8. https://git.soma.salesforce.com/cc-mobify/portal_app/blob/sfci-main/.ssr-infrastructure/assets/lambdas/commerce-cloud/utils.js#L1-L5
