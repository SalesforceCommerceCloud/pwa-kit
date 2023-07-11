/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  runGeneratorWithResponses,
  executeCommand,
} from "./execute-shell-commands.js";
import config from "../config.js";
import { program, Argument } from "commander";

const main = async (opts) => {
  const { args } = opts;
  const [project] = args;
  console.log("Input", args);
  if (opts.args.length !== 1) {
    console.log(program.helpInformation());
    process.exit(1);
  }
  const latestGitSHA = await executeCommand(config.GET_GIT_SHA_CMD);
  const outputDir = `../generated-projects/${project}-${latestGitSHA}`;
  const generateAppCommand = `${config.GENERATOR_CMD} ${outputDir}`;
  const stdout = await runGeneratorWithResponses(
    generateAppCommand,
    config.CLI_RESPONSES[project]
  );
  return stdout;
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
