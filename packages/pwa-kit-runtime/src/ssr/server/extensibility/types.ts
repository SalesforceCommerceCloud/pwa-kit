import { Application } from 'express'

/**
 * Interface that must be implemented by all React application extensions.
 */
export interface IApplicationExtension {
    /**
     * The name of the extension that will be used for logging.
     */
    getName(): string

    /**
     * Called to enhance the Express application by adding routes, middleware, or any other functionalities.
     * The method is predominantly used during server setup.
     *
     * @param app - The Express application instance to be extended.
     * @returns The extended Express application instance.
     */
    extendApp(app: Application): Application
}
