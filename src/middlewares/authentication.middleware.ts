const authenticationMiddleware: MiddleWareType = (req, res, next) => {
  const authToken = req.cookies.auth || req.headers.authorization;

  if (!authToken) {
    return res.sendStatus(403);
  }
};
