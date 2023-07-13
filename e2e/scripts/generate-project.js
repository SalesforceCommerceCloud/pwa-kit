/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {
  runGeneratorWithResponses,
  executeCommand,
} = require("./execute-shell-commands.js");
const config = require("../config.js");
const { program, Argument } = require("commander");

const main = async (opts) => {
  const { args } = opts;
  const [project] = args;
  if (opts.args.length !== 1) {
    console.log(program.helpInformation());
    process.exit(1);
  }
  const latestGitSHA = await executeCommand(config.GET_GIT_SHA_CMD);
  await executeCommand('mkdir ../generated-projects')
  const outputDir = `../generated-projects/${project}-${latestGitSHA}`;
  const generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
  try {
    const stdout = await runGeneratorWithResponses(
      generateAppCommand,
      config.CLI_RESPONSES[project]
    );
    return stdout;
  } catch(err) {
    // Generator failed to create project
  }
};

program.description(
  `Generate a retail-react-app project using the key <project-key>`
);

program.addArgument(
  new Argument("<project-key>", "project key").choices([
    "retail-app-demo",
    "retail-app-ext",
    "retail-app-no-ext",
  ])
);

program.parse(process.argv);

main(program);
