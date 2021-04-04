const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const AdminController = require("../controller/admin.controller");

const Task = require("../model/task.model");
const User = require("../model/user.model");

/*ADMIN*/
// Delete all data belonging to a user
// Tasks created by the user should be deleted from the system
// Tasks that the user is following should be unfollowed
/*ADMIN*/

// Get every User
router.get(
  "/users",
  AdminController.verifyJwtTokenAndAdmin,
  (req, res, next) => {
    User.find({ role: "user" }).then((user) => {
      res.json({ users: user, message: "Every user!" });
      console.log(user, "user");
    });
  }
);

// Delete User
router.delete(
  "/delete/:id",
  AdminController.verifyJwtTokenAndAdmin,
  (req, res, next) => {
    User.findById(req.params.id)
      .then((user) => {
        User.find({}).then((users) => {
          return users.map((user) => {
            // removes task from every user that is following the task
            User.findOneAndUpdate(
              { "followedTasks.user": mongoose.Types.ObjectId(req.params.id) },
              {
                $pull: {
                  followedTasks: {
                    user: mongoose.Types.ObjectId(req.params.id),
                  },
                },
              }
            ).then((user) => user);
          });
        });

        user.followedTasks.map(({ _id, user }) => {
          // removes user from followers in Task
          Task.findByIdAndUpdate(
            _id,
            {
              $pull: {
                followers: { _id: mongoose.Types.ObjectId(req.params.id) },
              },
            },
            { new: true }
          ).then((task) => task);

          // removes user from allTasks.followers if user is in allTasks.followers
          User.findOneAndUpdate(
            {
              "allTasks._id": mongoose.Types.ObjectId(_id),
            },
            {
              $pull: {
                "allTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req.params.id),
                },
              },
            }
          ).then((user) => user);

          // removes user from incompleteTasks.followers if user is in incompleteTasks.followers
          User.findOneAndUpdate(
            {
              "incompleteTasks._id": mongoose.Types.ObjectId(_id),
            },
            {
              $pull: {
                "incompleteTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req.params.id),
                },
              },
            }
          ).then((user) => user);

          // removes user from completeTasks.followers if user is in completeTasks.followers
          User.findOneAndUpdate(
            {
              "completeTasks._id": mongoose.Types.ObjectId(_id),
            },
            {
              $pull: {
                "completeTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req.params.id),
                },
              },
            }
          ).then((user) => user);
        });

        // delete every task of the user
        user.allTasks.map(({ _id }) => {
          Task.findByIdAndDelete(_id).then((task) => task);
        });

        // delete user
        return User.findByIdAndDelete(req.params.id).then((user) =>
          res.json({ message: "User deleted", deletedUser: user })
        );
      })
      .catch((err) => res.json({ message: "Check Id!" }));
  }
);

module.exports = router;
