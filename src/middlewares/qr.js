const jwt = require("jsonwebtoken");

const config = process.env;

const verifyToken = (req, res, next) => {
  let token = req.body.token

  if (!token) {
    return res.status(403).json({ status: "TOKEN_IS_REQUIRED" })
  }

  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ status: "TOKEN_IS_INVALID" })
  }
  return next();
};

module.exports = verifyToken;