## Introduction

Once your build is ready for shoppers, it’s time to deploy your project! Mobify Cloud will help you manage the deployment of your Progressive Web App (PWA). It allows you to preview the project created during development, and to publish that project when it’s ready to go into testing or production.

In this tutorial, we will walk you through the steps to:

-   Setup your API Key,
-   Use the terminal to push a bundle to Mobify Cloud, and;
-   Use the Mobify Cloud web interface to deploy a project.

To deploy your PWA, you will take your project code, package it into a bundle, and then deploy it to a target environment, in this case production.

## Prerequisites

Before diving into this tutorial, take a minute to check that you have a developer account on Mobify Cloud.

To request your Mobify Cloud account:

-   **Contact** [Mobify support](https://support.mobify.com).
-   Next, you will receive an email invitation with a link to Mobify Cloud.
-   **Fill in the fields** to create your own project. Enter your site’s _URL_, and a _name_ for the project.

Your Mobify Cloud account has access to a project. Make sure that you’ve cloned the codebase for the project.

## Saving your credentials <a name="saving-your-credentials"></a>

<div class="c-callout">
  <p>
    <strong>Note:</strong> If you already have a .mobify file, you can skip this section.
  </p>
</div>

Before you can push a bundle, you must ensure that your machine has a record of your API for Mobify Cloud. To do this, you will need to create an invisible file in your home directory called `.mobify` using a command-line tool that we provide.

<p class="u-margin-top u-margin-bottom">
  First, look up your Mobify Cloud API Key:
</p>

1. In your browser, go to the [Mobify Cloud Account Settings page](https://cloud.mobify.com/account/).
2. Copy the email address as it appears in the field under **Update Account Information**. _You will need this to generate the .mobify file._
3. Scroll down to the section called **Authorize Your Computer To Push Bundles**.

-   If you are an existing Mobify Cloud user, click the **Reset API Key** button.
-   If you are a new Mobify Cloud user, click the **Generate your API Key** button.

4. You will be asked to confirm resetting your API key. Click **OK**.
5. Copy the API key. You will need this to generate the .mobify file. (The next time you come back to the **Account > Settings** page in Mobify Cloud, the API key will not be displayed in full, so you would have to reset the API key to copy the full text of the API key.)

Now you're ready to generate the `.mobify` file:

1. Open your command line interface and navigate to the project's `packages/pwa` directory.

2. Run the following command. (In the code block below, you will need to replace `$EMAIL` and `$API_KEY` with the email address and API key that you just copied. Keep the double quotes on either side of your `$EMAIL` and `$API_KEY`.)

```bash
training-project $ npm run save-credentials -- --user "$EMAIL" --key "$API_KEY"
```

3. If you clicked the **Reset API Key** button in order to obtain your API key, you will need to run the `save-credentials` script again on any other computers where you’ll be pushing bundles from.

4. Check that you created the file correctly by running `ls -a` in the terminal from your home directory. This command allows you to see all your files, including secret files. You should see a file called `.mobify` in your home directory if it's been created successfully.

Now you’re ready to push bundles!

## Pushing the bundle

Building a bundle involves taking the files you've got locally, getting them ready for production, and then uploading them to Mobify Cloud.

### Modifying package.json parameters

We need to customize a few parameters inside the `package.json` file before we can push our bundle. Here is how to configure the parameters:

1. `name`: When you push a bundle, `name`specifies which project the bundle will push to. Note that this is different than the title you entered for your Mobify Cloud project-- this `name` field is actually a project ID. To configure, go to _cloud.mobify.com_ in your browser, and in the left-hand side navigation, click on **Settings**.
1. Copy the text inside the field called **Mobify Project ID** and paste it into the name field in `package.json`.
1. `projectSlug`: To configure, copy the parameter you entered from `name`.
1. `aJSSlug`: This parameter is used for analytics. To configure, copy the parameter you entered from `name`.
1. `ssrEnabled`: Check that this is set to true for server side rendered projects, and false for tag-loaded projects.

#### Server-side rendered PWAs

If you’re working on a server-side rendered project, you will also configure these parameters within `package.json`:

`ssrParameters`:

1. `mobify.ssrParameters.proxyConfigs[0].protocol`: depending on your configuration, set this to either `http` or `https`.
2. `mobify.ssrParameters.proxyConfigs[0].host`: enter the hostname of your server.
3. `mobify.ssrParameters.proxyConfigs[0].path`: enter the base path of your server.

Here is an example of `package.json` configured for www.merlinspotions.com:

```json
{
    "name": "scaffold-pwa",
    "projectSlug": "scaffold-pwa",
    "aJSSlug": "scaffold-pwa",
    "mobify": {
        "ssrParameters": {
            "proxyConfigs": [
                {
                    "protocol": "https",
                    "host": "www.merlinspotions.com",
                    "path": "base"
                }
            ]
        }
    }
}
```

That’s all! Now you can run the bundle pushing script.

### Running the push script

In your terminal, run the following command from your project directory:

```bash
training-project $ npm run push -- -m "insert a custom string for yourself to recognize this bundle"
```

**Tip**: For a list of other options you can supply to the push script, run it with the `--help` option:

```bash
training-project $ npm run push -- --help
```

## Publishing a bundle

For any site that uses the Mobify Platform, you can only designate **one bundle at a time** as published for each environment. As a default, every project comes with a single environment, called production. (If you need more than one environment, please contact [Mobify support](https://support.mobify.com).)

To publish a bundle that you have pushed to Mobify Cloud:

1. In your browser, go to [Mobify Cloud](https://cloud.mobify.com/)
2. Here, you will see a list of your projects. Click on the name of your project.
3. In the left-hand sidebar, click on **Bundles**
4. **Find** the bundle that you want to publish
5. Click the **Publish** button next to the bundle
6. Click **Confirm Publish**
7. You’ll know it worked when you see your bundle appear underneath Published Bundle. (For your first deployment to a new target, publishing may take an hour!) If you suspect you’ve made an error, read on for our Troubleshooting section.

For tag-loaded projects, you can still preview any of the other bundles that have been pushed to Mobify Cloud.

## Troubleshooting (pushing a bundle)

When a bundle is successfully pushed, you should see the message "Beginning upload..." followed by "Bundle Uploaded!" and a link to preview the bundle.

If something went wrong, you will likely see one of three different error messages after the “Beginning upload…” message. You can scroll back up in your terminal to find the error message.

Here’s how to troubleshoot all the possible error messages that you may encounter when pushing a bundle.

### HTTP 404

<figure class="u-text-align-center">

![HTTP 404 Error](images/http-404.png)

</figure>

In this type of error, either a project **does not exist with that name**, or you are **not authorized to change it**.

What to do:

1. Repeat the steps to push a bundle and make sure that the email address and API key settings you pass to the command line script match the settings in Mobify Cloud.
2. Verify that your project appears on the Mobify Cloud home page under Projects
    - If your project does not appear, contact [Mobify support](https://support.mobify.com) to make sure that the project has been created and that you have been granted access to it as a team member.
3. Open the project on Mobify Cloud and copy the string under Mobify Project ID.
4. Open package.json in the web directory inside your project directory.
5. Verify that the values for name and projectSlug both match the project ID string you copied in step 3.

### HTTP 401 unauthorized

<figure class="u-text-align-center">

![HTTP 401 Error](images/http-401.png)

</figure>

If your error message looks like this, you may have inadequate permission to push bundles. (If your role is set to "Read Only," you will not be able to push bundles.) To remedy this error, contact [Mobify support](https://support.mobify.com) and ask to have your role elevated to push bundles.

### HTTP 413 request entity too large

<figure class="u-text-align-center">

![HTTP 413 Error](images/http-413.png)

</figure>

You may get an HTTP 413 error if your bundle is too large, as the maximum size for bundles is 50 MB. To fix this error, check the size of your bundle by inspecting the build folder within your project. If your project is nearing this amount, or has already exceeded it, here’s what you can do to reduce the bundle size:

-   Remove unused or unnecessary assets
-   Scale down any images

Once you’ve reduced the size of your project files, try pushing the bundle again.

## Next steps

Nice work, you've finished our deployment guide! After completing this guide, you've successfully published your first bundle to Mobify Cloud and learned how to resolve some of the errors that you may encounter.

To continue learning about the Mobify Platform, check out our [Architecture docs](../../architecture), or try another one of our other hands-on exercises in [Guides](../../guides).

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
