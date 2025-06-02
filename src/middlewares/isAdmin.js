const checkIfAdminRoute = (req, res, next) => {
  req.isAdminRoute = req.originalUrl.includes("/admin");
  next();
};

export default checkIfAdminRoute;
