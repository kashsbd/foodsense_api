const jwt = require("jsonwebtoken");

exports.validateToken = (req, res, next) => {
  const token = req.headers["authentication"]?.split(" ")[1];
  const key = process.env.JWT_SECRET;

  if (!token)
    return res
      .status(401)
      .send({ success: false, error: "Please provide token." });

  jwt.verify(token, key, (err, decoded) => {
    if (err) {
      return res.status(401).send({ success: false, error: err.message });
    }
    req.loggedInUser = decoded;
    next();
  });
};
