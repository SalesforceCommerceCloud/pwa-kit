import loadable from '@loadable/component'

const Home = loadable(() => import("./pages/home.tsx"));

const routes = [
  {
    path: "/",
    exact: true,
    component: Home,
  },
];

export default routes;
