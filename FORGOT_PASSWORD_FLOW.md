# Complete Navigation Guide: "Forgot Password?" Functionality

This document traces the complete flow of the "Forgot Password?" feature from the login page through all components, hooks, handlers, and server-side processing.

---

## 📍 Flow Overview

```
User clicks "Forgot Password?" 
  → Navigates to /reset-password
  → Enters email
  → API call to get reset token
  → Server receives callback from SLAS
  → Email sent with magic link
  → User clicks link
  → Lands on /reset-password-landing
  → Enters new password
  → Password reset complete
```

---

## 🔍 Step-by-Step Navigation

### **STEP 1: User Clicks "Forgot Password?" Link**

**Location:** `app/components/forms/login-fields.jsx`

```28:36:app/components/forms/login-fields.jsx
                    {handleForgotPasswordClick && (
                        <Box>
                            <Button variant="link" size="sm" onClick={handleForgotPasswordClick}>
                                <FormattedMessage
                                    defaultMessage=" password?"
                                    id="login_form.link.forgot_password"
                                />
                            </Button>
                        </Box>
                    )}
```

**Component Hierarchy:**
- `app/pages/login/index.jsx` (Login Page)
  - `app/components/login/index.jsx` (LoginForm)
    - `app/components/standard-login/index.jsx` (StandardLogin)
      - `app/components/forms/login-fields.jsx` (LoginFields) ← **"Forgot Password?" link here**

**Handler Function:**
```212:212:app/pages/login/index.jsx
                        handleForgotPasswordClick={() => navigate('/reset-password')}
```

**Action:** Navigates to `/reset-password` route

---

### **STEP 2: Route Configuration**

**Location:** `app/routes.jsx`

```75:84:app/routes.jsx
    {
        path: '/reset-password',
        component: ResetPassword,
        exact: true
    },
    {
        path: RESET_PASSWORD_LANDING_PATH,
        component: ResetPassword,
        exact: true
    },
```

**Constants:**
```255:255:app/constants.js
export const RESET_PASSWORD_LANDING_PATH = '/reset-password-landing'
```

**Route Mapping:**
- `/reset-password` → `ResetPassword` component (initial form)
- `/reset-password-landing` → `ResetPassword` component (password update form)

---

### **STEP 3: Reset Password Page Component**

**Location:** `app/pages/reset-password/index.jsx`

**Key Logic:**
```28:48:app/pages/reset-password/index.jsx
const ResetPassword = () => {
    const {formatMessage} = useIntl()
    const form = useForm()
    const navigate = useNavigation()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const {pathname} = useLocation()
    const {path} = useRouteMatch()
    const {getPasswordResetToken} = usePasswordReset()

    const submitForm = async ({email}) => {
        try {
            await getPasswordResetToken(email)
        } catch (e) {
            const message =
                e.response?.status === 400
                    ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                    : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }
```

**Conditional Rendering:**
```74:82:app/pages/reset-password/index.jsx
                {path === RESET_PASSWORD_LANDING_PATH ? (
                    <ResetPasswordLanding />
                ) : (
                    <ResetPasswordForm
                        form={form}
                        submitForm={submitForm}
                        clickSignIn={() => navigate('/login')}
                    />
                )}
```

**Two Views:**
1. **Initial Form** (`ResetPasswordForm`) - User enters email
2. **Landing Page** (`ResetPasswordLanding`) - User sets new password (after clicking email link)

---

### **STEP 4: Reset Password Form Component (Email Entry)**

**Location:** `app/components/reset-password/index.jsx`

**UI Structure:**
```16:79:app/components/reset-password/index.jsx
const ResetPasswordForm = ({submitForm, clickSignIn = noop, form}) => {
    return (
        <Fragment>
            {!form.formState.isSubmitSuccessful ? (
                <>
                    <Stack justify="center" align="center" spacing={8}>
                        <BrandLogo width="60px" height="auto" />
                        <Stack spacing={2}>
                            <Text align="center" fontSize="xl" fontWeight="semibold">
                                <FormattedMessage
                                    defaultMessage="Reset Password"
                                    id="reset_password_form.title.reset_password"
                                />
                            </Text>
                            <Text fontSize="sm" align="center" color="gray.700">
                                <FormattedMessage
                                    defaultMessage="Enter your email to receive instructions on how to reset your password"
                                    id="reset_password_form.message.enter_your_email"
                                />
                            </Text>
                        </Stack>
                    </Stack>
                    <form onSubmit={form.handleSubmit(submitForm)} data-testid="sf-auth-modal-form">
                        <Stack paddingTop={8} spacing={8} paddingLeft={4} paddingRight={4}>
                            {form.formState.errors?.global && (
                                <Alert status="error">
                                    <AlertIcon color="red.500" boxSize={4} />
                                    <Text fontSize="sm" ml={3}>
                                        {form.formState.errors.global.message}
                                    </Text>
                                </Alert>
                            )}
                            <ResetPasswordFields form={form} />
                            <Stack spacing={6}>
                                <Button
                                    type="submit"
                                    onClick={() => form.clearErrors('global')}
                                    isLoading={form.formState.isSubmitting}
                                >
                                    <FormattedMessage
                                        defaultMessage="Reset Password"
                                        id="reset_password_form.button.reset_password"
                                    />
                                </Button>

                                <Stack direction="row" spacing={1} justify="center">
                                    <Text fontSize="sm">
                                        <FormattedMessage
                                            defaultMessage="Or return to"
                                            id="reset_password_form.message.return_to_sign_in"
                                            description="Precedes link to return to sign in"
                                        />
                                    </Text>
                                    <Button variant="link" size="sm" onClick={clickSignIn}>
                                        <FormattedMessage
                                            defaultMessage="Sign in"
                                            id="reset_password_form.action.sign_in"
                                        />
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    </form>
                </>
            ) : (
                // Success message shown after form submission
```

**Form Fields:**
- Uses `ResetPasswordFields` component
- Location: `app/components/forms/reset-password-fields.jsx`
- Uses `useResetPasswordFields` hook for field configuration

---

### **STEP 5: Business Logic Hook**

**Location:** `app/hooks/use-password-reset.js`

**Key Functions:**
```18:58:app/hooks/use-password-reset.js
export const usePasswordReset = () => {
    const showToast = useToast()
    const {formatMessage} = useIntl()
    const appOrigin = useAppOrigin()
    const config = getConfig()
    const resetPasswordCallback =
        config.app.login?.resetPassword?.callbackURI || '/reset-password-callback'
    const callbackURI = isAbsoluteURL(resetPasswordCallback)
        ? resetPasswordCallback
        : `${appOrigin}${getEnvBasePath()}${resetPasswordCallback}`

    const getPasswordResetTokenMutation = useAuthHelper(AuthHelpers.GetPasswordResetToken)
    const resetPasswordMutation = useAuthHelper(AuthHelpers.ResetPassword)

    const getPasswordResetToken = async (email) => {
        await getPasswordResetTokenMutation.mutateAsync({
            user_id: email,
            callback_uri: callbackURI
        })
    }

    const resetPassword = async ({email, token, newPassword}) => {
        await resetPasswordMutation.mutateAsync(
            {user_id: email, pwd_action_token: token, new_password: newPassword},
            {
                onSuccess: () => {
                    showToast({
                        title: formatMessage({
                            defaultMessage: 'Password Reset Success',
                            id: 'password_reset_success.toast'
                        }),
                        status: 'success',
                        position: 'bottom-right'
                    })
                }
            }
        )
    }

    return {getPasswordResetToken, resetPassword}
}
```

**What Happens:**
1. `getPasswordResetToken(email)` is called when user submits email
2. Uses Commerce SDK `AuthHelpers.GetPasswordResetToken`
3. Sends request to Commerce Cloud SLAS API
4. SLAS will POST to the `callbackURI` (`/reset-password-callback`)

**Commerce SDK Integration:**
- Uses `@salesforce/commerce-sdk-react` package
- `useAuthHelper` hook provides authentication helpers
- `AuthHelpers.GetPasswordResetToken` - Gets reset token from SLAS
- `AuthHelpers.ResetPassword` - Resets password with token

---

### **STEP 6: Server-Side Callback Handler**

**Location:** `app/ssr.js`

**Callback Route Handler:**
```411:425:app/ssr.js
    // Handles the reset password callback route. SLAS makes a POST request to this
    // endpoint sending the email address and reset password token. Then this endpoint calls
    // the sendMagicLinkEmail function to send an email with the reset password magic link.
    // https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-password-reset.html#slas-password-reset-flow
    app.post(resetPasswordCallback, (req, res) => {
        const slasCallbackToken = req.headers['x-slas-callback-token']
        validateSlasCallbackToken(slasCallbackToken).then(() => {
            sendMagicLinkEmail(
                req,
                res,
                config.app.login?.resetPassword?.landingPath,
                process.env.MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE
            )
        })
    })
```

**Callback Configuration:**
```227:228:app/ssr.js
const resetPasswordCallback =
    config.app.login?.resetPassword?.callbackURI || '/reset-password-callback'
```

**Email Sending Function:**
```232:256:app/ssr.js
// Reusable function to handle sending a magic link email.
// By default, this implementation uses Marketing Cloud.
async function sendMagicLinkEmail(req, res, landingPath, emailTemplate, redirectUrl) {
    // Extract the base URL from the request
    const base = req.protocol + '://' + req.get('host')

    // Extract the email_id and token from the request body
    const {email_id, token} = req.body

    // Construct the magic link URL
    let magicLink = `${base}${landingPath}?token=${encodeURIComponent(token)}`
    if (landingPath === config.app.login?.resetPassword?.landingPath) {
        // Add email query parameter for reset password flow
        magicLink += `&email=${encodeURIComponent(email_id)}`
    }
    if (landingPath === config.app.login?.passwordless?.landingPath && redirectUrl) {
        magicLink += `&redirect_url=${encodeURIComponent(redirectUrl)}`
    }

    // Call the emailLink function to send an email with the magic link using Marketing Cloud
    const emailLinkResponse = await emailLink(email_id, emailTemplate, magicLink)

    // Send the response
    res.send(emailLinkResponse)
}
```

**What Happens:**
1. SLAS (Salesforce Login As Service) POSTs to `/reset-password-callback`
2. Server validates the callback token
3. Constructs magic link: `{base}/reset-password-landing?token={token}&email={email}`
4. Sends email via Marketing Cloud using `emailLink()` function
5. Email contains link to reset password landing page

**Email Function:**
- Location: `app/ssr.js` (lines 143-225)
- Function: `emailLink(emailId, templateId, magicLink)`
- Uses Marketing Cloud API to send email

---

### **STEP 7: User Clicks Email Link**

**URL Format:**
```
https://your-domain.com/reset-password-landing?token={token}&email={email}
```

**Route:** `/reset-password-landing` → `ResetPassword` component (with `path === RESET_PASSWORD_LANDING_PATH`)

---

### **STEP 8: Reset Password Landing Page**

**Location:** `app/pages/reset-password/reset-password-landing.jsx`

**Key Logic:**
```32:56:app/pages/reset-password/reset-password-landing.jsx
const ResetPasswordLanding = () => {
    const form = useForm()
    const {formatMessage} = useIntl()
    const {search} = useLocation()
    const navigate = useNavigation()
    const queryParams = new URLSearchParams(search)
    const email = decodeURIComponent(queryParams.get('email'))
    const token = decodeURIComponent(queryParams.get('token'))
    const fields = useUpdatePasswordFields({form})
    const password = form.watch('password')
    const {resetPassword} = usePasswordReset()

    const submit = async (values) => {
        form.clearErrors()
        try {
            await resetPassword({email, token, newPassword: values.password})
            navigate('/login')
        } catch (error) {
            const errorData = await error.response?.json()
            const message = INVALID_TOKEN_ERROR.test(errorData.message)
                ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }
```

**What Happens:**
1. Extracts `token` and `email` from URL query parameters
2. User enters new password and confirmation
3. Calls `resetPassword()` from `usePasswordReset` hook
4. Uses Commerce SDK `AuthHelpers.ResetPassword`
5. On success: Shows toast notification and navigates to `/login`
6. On error: Displays error message

**Form Fields:**
- Uses `useUpdatePasswordFields` hook
- Location: `app/components/forms/useUpdatePasswordFields.jsx`
- Includes password and confirm password fields
- Shows password requirements component

---

### **STEP 9: Password Reset Complete**

**Success Flow:**
1. `resetPassword()` mutation succeeds
2. Toast notification shown: "Password Reset Success"
3. User redirected to `/login`
4. User can now login with new password

---

## 📂 Complete File Map

### **UI Components (Views)**
1. **Login Fields** - `app/components/forms/login-fields.jsx`
   - Contains "Forgot Password?" link button

2. **Standard Login** - `app/components/standard-login/index.jsx`
   - Wraps LoginFields component

3. **Login Form** - `app/components/login/index.jsx`
   - Main login form container

4. **Reset Password Form** - `app/components/reset-password/index.jsx`
   - Email entry form

5. **Reset Password Fields** - `app/components/forms/reset-password-fields.jsx`
   - Email input field

6. **Reset Password Landing** - `app/pages/reset-password/reset-password-landing.jsx`
   - New password entry form

### **Page Components (Route Handlers)**
1. **Login Page** - `app/pages/login/index.jsx`
   - Handles login view and navigation

2. **Reset Password Page** - `app/pages/reset-password/index.jsx`
   - Routes between form and landing views

### **Business Logic (Hooks)**
1. **use-password-reset.js** - `app/hooks/use-password-reset.js`
   - `getPasswordResetToken(email)` - Requests reset token
   - `resetPassword({email, token, newPassword})` - Resets password

2. **use-navigation.js** - `app/hooks/use-navigation.js`
   - Navigation helper

3. **useUpdatePasswordFields** - `app/components/forms/useUpdatePasswordFields.jsx`
   - Form field configuration for password update

### **Server-Side Handlers**
1. **ssr.js** - `app/ssr.js`
   - `POST /reset-password-callback` - SLAS callback handler
   - `sendMagicLinkEmail()` - Email sending function
   - `emailLink()` - Marketing Cloud integration

### **Configuration**
1. **routes.jsx** - `app/routes.jsx`
   - Route definitions

2. **constants.js** - `app/constants.js`
   - `RESET_PASSWORD_LANDING_PATH = '/reset-password-landing'`

3. **config/default.js** - `config/default.js`
   - Reset password callback URI configuration
   - Landing path configuration

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LOGIN PAGE                                                    │
│    app/pages/login/index.jsx                                    │
│    └─> LoginForm                                                │
│        └─> StandardLogin                                        │
│            └─> LoginFields                                       │
│                └─> "Forgot Password?" Button                    │
│                    onClick: navigate('/reset-password')          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. RESET PASSWORD PAGE                                           │
│    app/pages/reset-password/index.jsx                           │
│    └─> ResetPasswordForm                                        │
│        └─> ResetPasswordFields (email input)                    │
│            └─> User enters email                                 │
│                └─> submitForm()                                 │
│                    └─> getPasswordResetToken(email)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. BUSINESS LOGIC HOOK                                          │
│    app/hooks/use-password-reset.js                              │
│    └─> getPasswordResetToken(email)                             │
│        └─> useAuthHelper(AuthHelpers.GetPasswordResetToken)     │
│            └─> API Call to Commerce Cloud SLAS                  │
│                └─> callback_uri: '/reset-password-callback'    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVER-SIDE CALLBACK                                         │
│    app/ssr.js                                                   │
│    └─> POST /reset-password-callback                            │
│        └─> validateSlasCallbackToken()                          │
│            └─> sendMagicLinkEmail()                             │
│                └─> Construct magic link:                        │
│                    /reset-password-landing?token=X&email=Y      │
│                └─> emailLink() → Marketing Cloud               │
│                    └─> Email sent to user                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. USER CLICKS EMAIL LINK                                      │
│    URL: /reset-password-landing?token=X&email=Y                 │
│    └─> ResetPassword component                                  │
│        └─> path === RESET_PASSWORD_LANDING_PATH                │
│            └─> ResetPasswordLanding                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RESET PASSWORD LANDING PAGE                                  │
│    app/pages/reset-password/reset-password-landing.jsx         │
│    └─> Extract token & email from URL                           │
│        └─> User enters new password                             │
│            └─> submit()                                        │
│                └─> resetPassword({email, token, newPassword})   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. PASSWORD RESET                                               │
│    app/hooks/use-password-reset.js                              │
│    └─> resetPassword()                                          │
│        └─> useAuthHelper(AuthHelpers.ResetPassword)             │
│            └─> API Call to Commerce Cloud SLAS                 │
│                └─> Password updated                             │
│                    └─> Show success toast                       │
│                        └─> Navigate to /login                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Integration Points

### **Commerce SDK (API Layer)**
- Package: `@salesforce/commerce-sdk-react`
- Hooks Used:
  - `useAuthHelper(AuthHelpers.GetPasswordResetToken)` - Request reset token
  - `useAuthHelper(AuthHelpers.ResetPassword)` - Reset password

### **SLAS (Salesforce Login As Service)**
- Handles authentication and password reset tokens
- POSTs callback to server when reset token is requested
- Validates tokens when password is reset

### **Marketing Cloud**
- Sends email with magic link
- Template: `MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE` environment variable
- Function: `emailLink()` in `app/ssr.js`

---

## 🧪 Testing Files

- `app/pages/login/index.test.js` - Login page tests
- `app/pages/reset-password/index.test.jsx` - Reset password page tests
- `app/hooks/use-password-reset.test.js` - Password reset hook tests
- `app/components/forms/reset-password-fields.test.js` - Form field tests

---

## 📝 Configuration Options

**Config File:** `config/default.js` or environment-specific config

**Key Settings:**
```javascript
app: {
  login: {
    resetPassword: {
      callbackURI: '/reset-password-callback',  // Server callback endpoint
      landingPath: '/reset-password-landing'     // Landing page after email click
    }
  }
}
```

**Environment Variables:**
- `MARKETING_CLOUD_RESET_PASSWORD_TEMPLATE` - Email template ID

---

## 🎯 Quick Reference: Finding Code

| What You Need | Where to Look |
|---------------|---------------|
| "Forgot Password?" link | `app/components/forms/login-fields.jsx:30` |
| Navigation handler | `app/pages/login/index.jsx:212` |
| Reset password form | `app/components/reset-password/index.jsx` |
| Reset password page | `app/pages/reset-password/index.jsx` |
| Business logic | `app/hooks/use-password-reset.js` |
| Server callback | `app/ssr.js:415` |
| Email sending | `app/ssr.js:234` |
| Landing page | `app/pages/reset-password/reset-password-landing.jsx` |
| Routes | `app/routes.jsx:76-83` |
| Constants | `app/constants.js:255` |

---

## 💡 Tips for Debugging

1. **Check callback URL** - Ensure `callbackURI` matches what's configured in Commerce Cloud
2. **Verify token validation** - Check `validateSlasCallbackToken()` in `app/ssr.js`
3. **Email delivery** - Check Marketing Cloud configuration and template ID
4. **Token expiration** - SLAS tokens have expiration times
5. **URL encoding** - Tokens and emails are URL encoded in the magic link

---

This completes the full navigation path for the "Forgot Password?" functionality! 🎉

