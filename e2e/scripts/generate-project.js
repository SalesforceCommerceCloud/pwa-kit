/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const { runGeneratorWithResponses } = require("./execute-shell-commands.js");
const config = require("../config.js");
const { program } = require("commander");
const { mkdirIfNotExists } = require("./utils.js");

const main = async (opts) => {
  const { projectKey, projectConfig } = opts;

  if (!projectKey && !projectConfig) {
    console.error("You must provide either <project-key> or <project-config>.");
    console.log(program.helpInformation());
    process.exit(1);
  }

  try {
    let cliResponses = [];
    let projectDir = projectKey;
    let preset;
    if (projectKey) {
      cliResponses = config.CLI_RESPONSES[projectKey];
      preset = config.PRESET[projectKey];
    } else {
      projectDir = projectConfig["projectDir"];
      let cliResponsesJsonArr = projectConfig["responses"];
      cliResponsesJsonArr.forEach((item) => {
        cliResponses.push({
          expectedPrompt: new RegExp(item.expectedPrompt, "i"),
          response: item.response,
        });
      });
    }

    // Explicitly create outputDir because generator runs into permissions issue when generating no-ext projects.
    await mkdirIfNotExists(config.GENERATED_PROJECTS_DIR);
    const outputDir = `${config.GENERATED_PROJECTS_DIR}/${projectDir}`;
    let generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
    // TODO: Update script to setup local verdaccio npm repo to allow running 'npx @salesforce/pwa-kit-create-app' to generate apps
    if (preset) {
      generateAppCommand = `${config.GENERATOR_CMD} ${outputDir} --preset ${preset}`;
    }
    return await runGeneratorWithResponses(generateAppCommand, cliResponses);
  } catch (err) {
    // Generator failed to create project
    console.error("Generator failed to create project", err);
    process.exit(1);
  }
};

// Define the program with description and arguments
program
  .description(
    "Generate a retail-react-app project using the key <project-key> or the JSON <project-config>"
  )
  .option("--project-key <key>", "Project key", (value) => {
    const validKeys = [
      "retail-app-demo",
      "retail-app-ext",
      "retail-app-no-ext",
      "retail-app-private-client",
    ];
    if (!validKeys.includes(value)) {
      throw new Error("Invalid project key.");
    }
    return value;
  })
  .option(
    "--project-config <config>",
    "Project config as JSON string",
    (value) => {
      try {
        return JSON.parse(value);
      } catch (e) {
        throw new Error("Invalid JSON string.");
      }
    }
  )
  .action((options) => {
    // Call the main function with parsed options
    main(options);
  });

program.parse(process.argv);
