import { render } from "pwa-kit-react-sdk/ssr/server/react-rendering";

// TODO: It'd be nice if we could get this baked into the SDK somehow.
//       Haven't been able to get it to compile properly without including
//       it in the project!

const serverRenderer =
  ({ clientStats, serverStats }) =>
  (req, res, next) =>
    render(req, res);

export default serverRenderer;
