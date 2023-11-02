let routes= [];

import dashboard from "./vue-routes-dashboard";
import blogs from "./vue-routes-blogs";
import order from "./vue-routes-orders"

routes = routes.concat(dashboard);
routes = routes.concat(blogs);
routes = routes.concat(order);

export default routes;
