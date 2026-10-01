/** SOURCE OF TRUTH: APP_NAME.
 * WHAT: the project name the shell shows.
 * WHY: the header, the splash and the start page show the same name, written once.
 * WHERE: read by `AppLayout`, `AppSplash` and `HomeStartPage`.
 */
export const APP_NAME = '__PROJECT__';

/** SOURCE OF TRUTH: METRI_VERSION.
 * WHAT: the metri version installed in the project, read by vite.config.ts from node_modules/metri; empty outside a project.
 * WHY: the start page footer says which version of the method the project follows.
 * WHERE: read by the start page footer; the first UC takes it away with the page.
 */
export const METRI_VERSION = __METRI_VERSION__;
