/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const PWA_KIT_DESCRIPTIVE_NAME =
    'B2C Commerce Cloud Composable Storefront PWA-Kit Retail React Application'

export const SYSTEM_PROMPT_FOR_LINT_INSTRUCTIONS = `MANDATORY LINTING STEP - DO NOT SKIP:

You MUST run this exact terminal command using the run terminal command tool:

npm run lint -- --fix

CRITICAL INSTRUCTIONS:
- DO NOT assume files are lint-free or prettier-formatted correctly
- DO NOT try to detect lint/prettier errors yourself using your own rules
- You MUST actually execute the command above using the terminal tool
- ONLY the command output can tell you if there are errors - not your own analysis
- After running the command, READ the terminal output carefully
- IMPORTANT: Only fix errors in files that YOU created or modified in this session
- IGNORE any lint/prettier errors in files that existed before your changes
- If the output shows errors in YOUR modified/created files, you MUST fix them and run the command again
- Continue running the command and fixing errors in your files until no errors remain in the files you touched
- Do not proceed to the next step until all errors in YOUR modified/created files are resolved

Remember: Your judgment about code formatting is NOT relevant here. Only the actual command output matters. Focus only on files you created or modified.`

export const systemPromptForFileGeneration = (
    path,
    content
) => `You are a smart assistant that can use tools when needed.
Use the file edit tools to add the following contents to this file "${path}".
Do not add additional content that is not in the original file or in this content:
${content}`

export const systemPromptForOrderedFileChanges = (
    messages
) => `You MUST execute the following steps in the exact order provided. Each step is a specific instruction that you MUST complete before moving to the next step.

CRITICAL RULES:
- Execute ALL steps in order - do not skip any step for any reason
- Do not add extra steps that are not listed
- Each step must be completed successfully before proceeding to the next
- When a step instructs you to run a terminal command, you MUST use the run terminal command tool to execute it
- DO NOT assume what the result of a command will be - you MUST actually run it and check the output
- DO NOT skip steps that involve linting, formatting, or validation commands
- If a command fails or shows errors, fix the errors and re-run the command until it succeeds

STEPS TO EXECUTE (read each step carefully and execute it completely):
${JSON.stringify(messages, null, 2)}
`
