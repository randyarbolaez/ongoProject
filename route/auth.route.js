const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const bcryptSalt = 10;
const passport = require("passport");

const AuthController = require("../controller/auth.controller");

const User = require("../model/user.model");

// Signup
router.post("/signup", AuthController.usernameToLowerCase, (req, res, next) => {
  let { username, password } = req.body;
  username = username.toLowerCase();
  const salt = bcrypt.genSaltSync(bcryptSalt);

  if (username === "") {
    res.json({ message: "Username can't be empty." });
    return;
  }
  if (password == "") {
    res.json({ message: "Password can't be empty." });
    return;
  }

  new User({
    username,
    password: bcrypt.hashSync(password, salt),
    role: username == "admin" ? "admin" : "user",
  }).save((err, doc) => {
    if (!err) {
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return res.status(400).json(err);
        } else if (user) {
          return res
            .status(200)
            .json({ user, token: AuthController.generateJwt(user) });
        } else {
          return res.status(404).json(info);
        }
      })(req, res);
    } else {
      if (err.code == 11000) {
        res.status(422).json({ message: "Username is already taken." });
      }
      console.log("err: ", err);
    }
  });
});

// Authentication
router.post(
  "/authenticate",
  AuthController.usernameToLowerCase,
  (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(404).json(err);
      } else if (user) {
        return res
          .status(200)
          .json({ user, token: AuthController.generateJwt(user) });
      } else {
        return res.status(404).json(info);
      }
    })(req, res);
  }
);

module.exports = router;
