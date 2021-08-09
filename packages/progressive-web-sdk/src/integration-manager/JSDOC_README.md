[← Back to the Progressive Web SDK documentation](../)

# API Reference

The Integration Manager (IM) provides an API to back-end services that your PWA
can interact with. This helps to isolate network calls from the rest of your
app. It also provides an abstraction to make it easier when re-platforming your
app against a new e-commerce service (maybe you're using a home-grown solution
and it's time to move to an "enterprise" solution like Hybris or Salesforce
Commerce Cloud).

The Integration Manager consists of a set of commands, results, and types.

* **Commands** - These are really just redux thunks, but have a special term to
  differentiate them from other Redux actions.
* **Results** - Flux Standard Actions that communicate result data from a
  connector's command implementation back to the redux store.
* **Types** - These are [runtype](https://github.com/pelotom/runtypes) objects that
  define the structure of data returned by IM results.

## Commands

The IM API is composed of a series of Command actions. This forms the API that
you can call from the app to interact with the service you are building against.
The full list of commands is listed to the right (click to see full
documentation).

Commands that are designed to be called when a template loads follow a naming
convention of `initMyPage` (eg. [`initHomePage`](global.html#initHomePage)).

## Results

Result actions should be self-describing based on their type. In cases where
they carry a payload, they should use `createTypedAction` to define the payload
type and structure.

## Types

Types define the structure of Results that a connector can dispatch. Results are
typechecked in development only. At runtime the typecheck function is a no-op
and is guaranteed **not** to throw.
