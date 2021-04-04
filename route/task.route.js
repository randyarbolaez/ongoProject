const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const TaskController = require("../controller/task.controller");

const Task = require("../model/task.model");
const User = require("../model/user.model");

// Create task
router.post("/create", TaskController.verifyJwtToken, (req, res, next) => {
  let { task, completed, followers } = req.body;
  new Task({
    task,
    user: req._id,
  }).save((err, task) => {
    if (!err) {
      User.findByIdAndUpdate(req._id, {
        $push: {
          allTasks: task,
          incompleteTasks: task,
        },
      }).then((user) => user);
      res.json({ task, message: "Task was created" });
    } else {
      res.json({ err });
    }
  });
});

// Update task
router.put("/update/:id", TaskController.verifyJwtToken, (req, res, next) => {
  Task.findById(req.params.id)
    .then((task) => {
      if (task.user == req._id) {
        let { task } = req.body;
        Task.findByIdAndUpdate(
          req.params.id,
          {
            task,
          },
          { new: true }
        ).then((task) => {
          // updates allTasks if task is in allTasks
          User.findOneAndUpdate(
            {
              _id: req._id,
              "allTasks._id": task._id,
            },
            {
              $set: {
                "allTasks.$.task": task.task,
              },
            }
          ).then((user) => user);

          // updates incompleteTasks if task is in incompleteTasks
          User.findOneAndUpdate(
            {
              _id: req._id,
              "incompleteTasks._id": task._id,
            },
            {
              $set: {
                "incompleteTasks.$.task": task.task,
              },
            }
          ).then((user) => user);

          // updates completeTasks if task is in completeTasks
          User.findOneAndUpdate(
            {
              _id: req._id,
              "completeTasks._id": task._id,
            },
            {
              $set: {
                "completeTasks.$.task": task.task,
              },
            }
          ).then((user) => user);

          // updates followedTasks if task is in in followedTasks
          User.findOneAndUpdate(
            {
              "followedTasks._id": task._id,
            },
            {
              $set: {
                "followedTasks.$.task": task.task,
              },
            }
          ).then((user) => user);

          res.json({ task, message: "Task was updated" });
        });
      } else {
        res.json({ message: "You are not authorized to update this task" });
      }
    })
    .catch((err) =>
      res.json({
        message:
          "We're aware of the issue and trying to fix it as quick as possibe. :)",
      })
    );
});

// Delete task
router.delete(
  "/delete/:id",
  TaskController.verifyJwtToken,
  (req, res, next) => {
    Task.findById(req.params.id)
      .then((task) => {
        if (task.user == req._id || req.role == "admin") {
          User.findByIdAndUpdate(req._id, {
            $pull: {
              allTasks: { _id: mongoose.Types.ObjectId(task._id) },
              incompleteTasks: { _id: mongoose.Types.ObjectId(task._id) },
              completeTasks: { _id: mongoose.Types.ObjectId(task._id) },
              followedTasks: { _id: mongoose.Types.ObjectId(task._id) },
            },
          }).then((user) => user);

          // removes task if task is in in followedTasks
          User.findOneAndUpdate(
            {
              "followedTasks._id": task._id,
            },
            {
              $pull: {
                followedTasks: { _id: mongoose.Types.ObjectId(task._id) },
              },
            }
          ).then((user) => user);

          // removes task from allTasks if task is in in allTasks
          User.findOneAndUpdate(
            {
              "allTasks._id": task._id,
            },
            {
              $pull: {
                allTasks: { _id: mongoose.Types.ObjectId(task._id) },
              },
            }
          ).then((user) => user);

          // removes task from completeTasks if task is in in completeTasks
          User.findOneAndUpdate(
            {
              "completeTasks._id": task._id,
            },
            {
              $pull: {
                completeTasks: { _id: mongoose.Types.ObjectId(task._id) },
              },
            }
          ).then((user) => user);

          // removes task from incompleteTasks if task is in in incompleteTasks
          User.findOneAndUpdate(
            {
              "incompleteTasks._id": task._id,
            },
            {
              $pull: {
                incompleteTasks: { _id: mongoose.Types.ObjectId(task._id) },
              },
            }
          ).then((user) => user);

          // removes task
          Task.findByIdAndDelete(req.params.id).then((task) =>
            res.json({ deletedTask: task, message: "Task was deleted" })
          );
        } else {
          res.json({ message: "You are not authorized to delete this task" });
        }
      })
      .catch((err) =>
        res.json({
          message:
            "We're aware of the issue and trying to fix it as quick as possibe. :)",
        })
      );
  }
);

// Complete Task
router.put("/complete/:id", TaskController.verifyJwtToken, (req, res, next) => {
  Task.findById(req.params.id)
    .then((task) => {
      if (req._id !== task.user.toString()) {
        res.json({
          message: "You cannot complete a task that you didn't create!",
        });
        return;
      }
      if (task.completed) {
        return res.json({ message: "Task is already completed!" });
      } else {
        Task.findByIdAndUpdate(
          req.params.id,
          {
            $set: { completed: true },
          },
          { new: true }
        ).then((task) => {
          // updates allTasks if task is in allTasks
          User.findOneAndUpdate(
            {
              _id: req._id,
              "allTasks._id": task._id,
            },
            {
              $set: {
                "allTasks.$.completed": true,
              },
            }
          ).then((user) => user);

          // updates followedTasks if task is in in followedTasks
          User.findOneAndUpdate(
            {
              "followedTasks._id": task._id,
            },
            {
              $set: {
                "followedTasks.$.completed": true,
              },
            }
          ).then((user) => user);

          User.findByIdAndUpdate(req._id, {
            $push: { completeTasks: task },
            $pull: { incompleteTasks: { _id: task._id } },
          }).then((user) => user);
          res.json({ task, message: "Task was completed!" });
        });
      }
    })
    .catch((err) =>
      res.json({
        message:
          "Make sure ID is correct | We're aware of the issue and trying to fix it as quick as possibe. :)",
      })
    );
});

// Incomplete Task
router.put(
  "/incomplete/:id",
  TaskController.verifyJwtToken,
  (req, res, next) => {
    Task.findById(req.params.id)
      .then((task) => {
        if (req._id !== task.user.toString()) {
          res.json({
            message: "You didn't create this task!",
          });
          return;
        }
        if (!task.completed) {
          return res.json({ message: "Task is already incomplete!" });
        } else {
          Task.findByIdAndUpdate(
            req.params.id,
            {
              $set: { completed: false },
            },
            { new: true }
          ).then((task) => {
            // updates allTasks if task is in allTasks
            User.findOneAndUpdate(
              {
                _id: req._id,
                "allTasks._id": task._id,
              },
              {
                $set: {
                  "allTasks.$.completed": false,
                },
              }
            ).then((user) => user);

            // updates followedTasks if task is in followedTasks
            User.findOneAndUpdate(
              {
                "followedTasks._id": task._id,
              },
              {
                $set: {
                  "followedTasks.$.completed": false,
                },
              }
            ).then((user) => user);

            User.findByIdAndUpdate(req._id, {
              $push: { incompleteTasks: task },
              $pull: { completeTasks: { _id: task._id } },
            }).then((user) => user);
            res.json({ task, message: "Task was incompleted!" });
          });
        }
      })
      .catch((err) =>
        res.json({
          message:
            "Make sure ID is correct | We're aware of the issue and trying to fix it as quick as possibe. :)",
        })
      );
  }
);

// Follow task
router.put("/follow/:id", TaskController.verifyJwtToken, (req, res, next) => {
  Task.findById(req.params.id)
    .then((task) => {
      if (req._id == task.user) {
        res.json({ message: "You cannot follow a task you created!" });
        return;
      }
      if (
        task.followers.filter((followers) => followers._id == req._id).length
      ) {
        res.json({ message: "You cannot follow a task you already follow!" });
      } else {
        User.findByIdAndUpdate(req._id, {
          $push: { followedTasks: task },
        }).then((user) => {
          Task.findByIdAndUpdate(
            req.params.id,
            {
              $push: { followers: user },
            },
            { new: true }
          ).then((task) => {
            // updates allTasks if task is in allTasks
            User.findOneAndUpdate(
              {
                "allTasks._id": task._id,
              },
              {
                $push: {
                  "allTasks.$.followers": user,
                },
              }
            ).then((user) => user);

            // updates incompleteTasks if task is in incompleteTasks
            User.findOneAndUpdate(
              {
                "incompleteTasks._id": task._id,
              },
              {
                $push: {
                  "incompleteTasks.$.followers": user,
                },
              }
            ).then((user) => user);

            // updates completeTasks if task is in completeTasks
            User.findOneAndUpdate(
              {
                "completeTasks._id": task._id,
              },
              {
                $push: {
                  "completeTasks.$.followers": user,
                },
              }
            ).then((user) => user);
            res.json({ task, message: "Task was followed" });
          });
          user;
        });
      }
    })
    .catch((err) =>
      res.json({
        message:
          "We're aware of the issue and trying to fix it as quick as possibe. :)",
      })
    );
});

// Unfollow task
router.put("/unfollow/:id", TaskController.verifyJwtToken, (req, res, next) => {
  Task.findById(req.params.id)
    .then((task) => {
      if (
        !task.followers.filter((followers) => followers._id !== req._id).length
      ) {
        res.json({ message: "You weren't following this task!" });
      } else {
        User.findOneAndUpdate(
          { "followedTasks._id": task._id },
          {
            $pull: {
              followedTasks: { _id: mongoose.Types.ObjectId(task._id) },
            },
          }
        ).then((user) => user);

        // removes user from followers in Task
        Task.findByIdAndUpdate(
          req.params.id,
          {
            $pull: { followers: { _id: mongoose.Types.ObjectId(req._id) } },
          },
          { new: true }
        ).then((task) => {
          // updates allTasks if task is in allTasks
          User.findOneAndUpdate(
            {
              "allTasks._id": task._id,
            },
            {
              $pull: {
                "allTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req._id),
                },
              },
            }
          ).then((user) => user);

          // updates incompleteTasks if task is in incompleteTasks
          User.findOneAndUpdate(
            {
              "incompleteTasks._id": task._id,
            },
            {
              $pull: {
                "incompleteTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req._id),
                },
              },
            }
          ).then((user) => user);

          // updates completeTasks if task is in completeTasks
          User.findOneAndUpdate(
            {
              "completeTasks._id": task._id,
            },
            {
              $pull: {
                "completeTasks.$.followers": {
                  _id: mongoose.Types.ObjectId(req._id),
                },
              },
            }
          ).then((user) => user);

          res.json({ task, message: "Task was unfollowed" });
        });
      }
    })
    .catch((err) =>
      res.json({
        message:
          "We're aware of the issue and trying to fix it as quick as possibe. :)",
      })
    );
});

// Get incomplete tasks
router.get(
  "/incomplete-tasks",
  TaskController.verifyJwtToken,
  (req, res, next) => {
    User.findById(req._id).then((user) => {
      res.json({
        incompleteTasks: user.incompleteTasks,
        message: `You have ${user.incompleteTasks.length} incomplete task${
          user.incompleteTasks.length < 2 ? "" : "s"
        }`,
      });
    });
  }
);

// Get complete tasks
router.get(
  "/complete-tasks",
  TaskController.verifyJwtToken,
  (req, res, next) => {
    User.findById(req._id).then((user) => {
      res.json({
        completeTasks: user.completeTasks,
        message: `You have ${user.completeTasks.length} complete task${
          user.completeTasks.length < 2 ? "" : "s"
        }`,
      });
    });
  }
);

// Get followed tasks
router.get(
  "/followed-tasks",
  TaskController.verifyJwtToken,
  (req, res, next) => {
    User.findById(req._id).then((user) => {
      res.json({
        followedTasks: user.followedTasks,
        message: `You are following ${user.followedTasks.length} task${
          user.followedTasks.length < 2 ? "" : "s"
        }`,
      });
    });
  }
);

module.exports = router;
