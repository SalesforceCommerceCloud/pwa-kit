import loadable from "pwa-kit-react-sdk/loadable";

const Home = loadable(() => import("./pages/home"));

const routes = [
  {
    path: "/",
    exact: true,
    component: Home,
  },
];

export default routes;
