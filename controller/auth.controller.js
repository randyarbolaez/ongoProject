const jwt = require("jsonwebtoken");

const usernameToLowerCase = (req, res, next) => {
  req.body.username = req.body.username.toLowerCase();
  next();
};

const generateJwt = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });

module.exports = { usernameToLowerCase, generateJwt };
