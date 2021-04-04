const jwt = require("jsonwebtoken");

const verifyJwtTokenAndAdmin = (req, res, next) => {
  let token;
  if ("authorization" in req.headers) {
    token = req.headers["authorization"].split(" ")[1];
  }
  if (!token) {
    console.log(req.role);
    return res.status(403).send({ auth: false, message: "No token provided" });
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (decoded.role !== "admin") {
        res.json({
          message:
            "You are not authorized to delete this! You're not an admin.",
        });
        return;
      }
      if (err) {
        return res
          .status(500)
          .send({ auth: false, message: "Token authentication failed." });
      } else {
        req._id = decoded._id;
        req.role = decoded.role;
        next();
      }
    });
  }
};

module.exports = { verifyJwtTokenAndAdmin };
