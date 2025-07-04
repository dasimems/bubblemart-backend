export const routeGroup = {
    auth: "/auth",
    product: "/product",
    cart: "/cart",
    address: "/address",
    order: "/order",
    user: "/user",
    users: "/users",
    upload: "/upload",
    payment: "/payment",
    log: "/log"
  },
  allPaths = {
    login: `/login`,
    register: `/register`,
    logout: "/logout",
    delivered: "/delivered"
  },
  databaseKeys = {
    users: "Users",
    carts: "Carts",
    orders: "Orders",
    products: "Products",
    payments: "Payments",
    address: "Address",
    log: "Log"
  },
  cookieKeys = {
    auth: "auth"
  },
  MAX_RETURN_ITEM_COUNT = 20,
  defaultErrorMessage = "System error! Couldn't determine error cause";
