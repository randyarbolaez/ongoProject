require("dotenv").config();

// Packages
const bcrypt = require("bcrypt");
const express = require("express");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
// Packages

const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Database Setup
mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to Mongo!");
  })
  .catch((err) => {
    console.error("Error connecting to mongo", err);
  });
// Database Setup

//Middleware
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: "our-passport-local-strategy-app",
    resave: true,
    saveUninitialized: true,
  })
);
//Middleware

// User Model
const User = require("./model/user.model");
// User Model

// PASSPORT CONFIG
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, next) => {
      User.findOne(
        {
          username,
        },
        (err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            return next(null, false, {
              message: "Incorrect username",
            });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return next(null, false, {
              message: "Incorrect password",
            });
          }

          return next(null, user);
        }
      );
    }
  )
);

// PASSPORT CONFIG

app.use(passport.initialize());
app.use(passport.session());

//Routes
const admin = require("./route/admin.route");
app.use("/api/admin", admin);
const authRoute = require("./route/auth.route");
app.use("/api/auth", authRoute);
const taskRoute = require("./route/task.route");
app.use("/api/task", taskRoute);
//Routes

app.listen(process.env.PORT || 8080, () => {
  console.log(`Listening on http://localhost:${process.env.PORT}`);
});

module.exports = app;
