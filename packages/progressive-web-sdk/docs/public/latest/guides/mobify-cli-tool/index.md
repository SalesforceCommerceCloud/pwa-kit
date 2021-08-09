<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> This feature is in progress and subject to changes.
  </p>
</div>

The Mobify Command Line Interface (CLI) is a tool for managing your projects, targets, 
bundles, etc. on [Mobify Cloud](https://cloud.mobify.com). The tool is included 
in Mobify's `progressive-web-sdk`.

## Prerequisites to run the commands

To use the Mobify CLI, you will need a developer account on Mobify Cloud. To
request a developer account, contact [Mobify Cloud
support](https://support.mobify.com).

Before you can use the Mobify CLI, you need to have a `.mobify` file in your home
directory that contains your Mobify Cloud credentials. If you don't have that, follow
the steps for [Saving Your Credentials in Mobify Cloud](../deploying-with-mobify-cloud/#saving-your-credentials)

## How to run the commands

After you install the `progressive-web-sdk`, you can add `"mobify": "mobify"` to the `scripts` object of the
`package.json` file in the root folder of your project, then run the command by typing
```bash
npm run mobify -- <command> <subcommand> [options]
```

<div class="c-callout c--important u-margin-top-lg">
  <p>
    <strong>Important:</strong> The `--` is required in the above command. Otherwise, it won't run correctly.
  </p>
</div>

## Help docs

If you have questions when you use the CLI, you can use the help docs.

`npm run mobify -- -h` would show you a list of commands the CLI currently have. 

`npm run mobify -- <command> -h` will show you a list of sumcommands for that command.

`npm run mobify -- <command> <subcommand> -h` will show you how to use a specific subcommand.
