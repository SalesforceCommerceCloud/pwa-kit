/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Constants // TODO: Move to a shared location
export const LOCAL_EXTENSIONS_DIR = 'application-extensions'
export const EXTENSION_PACKAGE_NAMESPACE = '@salesforce'
export const IMPORT_REGEX = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"](\..*?)['"]/g
export const OVERRIDABLE_FILE_NAME = '.force_overrides'
export const MONO_REPO_WORKSPACE_FOLDER = 'packages'
export const NODE_MODULES_FOLDER = 'node_modules'
export const REQUIRES_REGEX = /require\(['"](\..*?)['"]\)/g
export const SRC_FOLDER = 'src'
