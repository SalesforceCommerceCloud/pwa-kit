/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * @file main.js
 * @description Arms the post-release cleanup for MRT targets in CI. 
 *
 * Intentionally empty. This file just needs to exist. Post step will read INPUT_DETAILS_FILE and perform release.
 * 
 * Why:
 * - GitHub Actions post steps execute even when a job fails or is manually cancelled,
 *   providing best-effort cleanup of leased resources.
 * - Keeping the actual release in post.js avoids releasing too early while the job
 *   is still running and centralizes all teardown logic at job end.
 *
 * See also:
 * - post.js (performs the actual release using the saved inputs)
 */
