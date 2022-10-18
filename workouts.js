const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");


const app = express();
const host = config.HOST;
const port = config.PORT;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());


// Create a new datastore
app.use((req, res, next) => {
    res.locals.store = new PgPersistence(req.session);
    next();
});


// Extract session info
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});



// Detect unauthorized access to routes.
const requiresAuthentication = (req, res, next) => {
    if (!res.locals.signedIn) {
        res.redirect(302, "/users/signin");
    } else {
      next();
    }
  };


// Redirect start page
app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let workoutLists = await store.sortedWorkoutLists();
    let workoutsInfo = workoutLists.map(workoutList => ({
      countAllWorkouts: workoutList.workouts.length,
      countDoneWorkouts: workoutList.workouts.filter(workout => workout.done).length,
      isDone: store.isDoneWorkoutList(workoutList),
    }));

    res.render("lists", {
      workoutLists,
      workoutsInfo,
    });
  })
);

// Render new workout list page
app.get("/lists/new", 
  requiresAuthentication,
  (req, res) => {
  res.render("new-list");
  }
);

// Create a new workout list
app.post("/lists",
  requiresAuthentication,
  [
    body("workoutListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The category title is required.")
      .isLength({ max: 100 })
      .withMessage("Category title must be between 1 and 100 characters.")
    //   .custom((title, { req }) => {
    //     let todoLists = req.session.todoLists;
    //     let duplicate = todoLists.find(list => list.title === title);
    //     return duplicate === undefined;
    //   })
    //   .withMessage("List title must be unique."),
  ],
  catchError(async (req, res) => {
    let errors = validationResult(req);
    let workoutListTitle = req.body.workoutListTitle;

    const rerenderNewList = () => {
      res.render("new-list", {
        workoutListTitle,
        flash: req.flash(),
      });
    };

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      rerenderNewList();
    } else if (await res.locals.store.existsWorkoutListTitle(workoutListTitle)) {
      req.flash("error", "The category title must be unique.");
      rerenderNewList();
    } else {
      let created = await res.locals.store.createWorkoutList(workoutListTitle);
      if (!created) {
        req.flash("error", "The category title must be unique.");
        rerenderNewList();
      } else {
        req.flash("success", "The category has been created.");
        res.redirect("/lists");
      }
    }
  })
);

// Render individual workout list and its todos
app.get("/lists/:workoutListId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let workoutListId = req.params.workoutListId;
    let workoutList = await res.locals.store.loadWorkoutList(+workoutListId);
    if (workoutList === undefined) throw new Error("Not found.");

    workoutList.workouts = await res.locals.store.sortedWorkouts(workoutList);

    res.render("list", {
      workoutList,
      isDoneWorkoutList: res.locals.store.isDoneWorkoutList(workoutList),
      hasUndoneTodos: res.locals.store.hasUndoneWorkouts(workoutList),
    });
  })
);

// Toggle completion status of a workout
app.post("/lists/:workoutListId/workouts/:workoutId/toggle",
  requiresAuthentication,
  catchError(async (req, res) => {
    let { workoutListId, workoutId } = req.params;
    let toggled = await res.locals.store.toggleDoneWorkout(+workoutListId, +workoutId);
    if (!toggled) throw new Error("Not found.");

    let workout = await res.locals.store.loadWorkout(+workoutListId, +workoutId);
    if (workout.done) {
      req.flash("success", `"${workout.title}" marked done.`);
    } else {
      req.flash("success", `"${workout.title}" marked as NOT done!`);
    }

    res.redirect(`/lists/${workoutListId}`);
  })
);

// Delete a workout
app.post("/lists/:workoutListId/workouts/:workoutId/destroy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let { workoutListId, workoutId } = req.params;
    let deleted = await res.locals.store.deleteWorkout(+workoutListId, +workoutId);
    if (!deleted) throw new Error("Not found.");

    req.flash("success", "The workout has been deleted.");
    res.redirect(`/lists/${workoutListId}`);
  })
);

// Mark all workouts as done
app.post("/lists/:workoutListId/complete_all",
  requiresAuthentication,
  catchError(async (req, res) => {
    let workoutListId = req.params.workoutListId;
    let completed = await res.locals.store.completeAllWorkouts(+workoutListId);
    if (!completed) throw new Error("Not found.");

    req.flash("success", "All workouts have been marked as done.");
    res.redirect(`/lists/${workoutListId}`);
  })
);

// Create a new workout and add it to the specified list
app.post("/lists/:workoutListId/workouts",
  requiresAuthentication,
  [
    body("workoutTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The workout title is required.")
      .isLength({ max: 100 })
      .withMessage("Workout title must be between 1 and 100 characters."),
  ],
  //highlight
  catchError(async (req, res) => {
    let workoutTitle = req.body.workoutTitle;
    let num_sets = req.body.num_sets;
    let num_reps = req.body.num_reps;
    let num_time = req.body.num_time;
    let num_weight = req.body.num_weight;
    let workoutListId = req.params.workoutListId;

    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));

      let workoutList = await res.locals.store.loadWorkoutList(+workoutListId);
      if (!workoutList) throw new Error("Not found.");

      workoutList.workouts = await res.locals.store.sortedWorkouts(workoutList);

      res.render("list", {
        workoutList,
        workoutTitle,
        num_sets,
        num_reps,
        num_time, 
        num_weight,
        isDoneWorkoutList: res.locals.store.isDoneWorkoutList(workoutList),
        hasUndoneWorkouts: res.locals.store.hasUndoneWorkouts(workoutList),
        flash: req.flash(),
      });
    } else {
      let created = await res.locals.store.createWorkout(+workoutListId, workoutTitle, num_sets, num_reps, num_time, num_weight);
      if (!created) throw new Error("Not found.");

      req.flash("success", "The workout has been created.");
      res.redirect(`/lists/${workoutListId}`);
    }
  })
);


// Render edit workout list form
app.get("/lists/:workoutListId/edit",
  requiresAuthentication,
  catchError(async (req, res) => {
    let workoutListId = req.params.workoutListId;
    let workoutList = await res.locals.store.loadWorkoutList(+workoutListId);
    if (!workoutList) throw new Error("Not found.");

    res.render("edit-list", { workoutList });
  })
);

// Delete workout list
app.post("/lists/:workoutListId/destroy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let workoutListId = req.params.workoutListId;
    let deleted = await res.locals.store.deleteWorkoutList(+workoutListId);
    if (!deleted) throw new Error("Not found.");

    req.flash("success", "Workout list deleted.");
    res.redirect("/lists");
  })
);

// Edit workout list title
app.post("/lists/:workoutListId/edit",
  requiresAuthentication,
  [
    body("workoutListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The category title is required.")
      .isLength({ max: 100 })
      .withMessage("Category title must be between 1 and 100 characters.")
    //   .custom((title, { req }) => {
    //     let todoLists = req.session.todoLists;
    //     let duplicate = todoLists.find(list => list.title === title);
    //     return duplicate === undefined;
    //   })
    //   .withMessage("List title must be unique."),
  ],
  catchError(async (req, res) => {
    let store = res.locals.store;
    let workoutListId = req.params.workoutListId;
    let workoutListTitle = req.body.workoutListTitle;

    const rerenderEditList = async () => {
      let workoutList = await store.loadWorkoutList(+workoutListId);
      if (!todoList) throw new Error("Not found.");

      res.render("edit-list", {
        workoutListTitle,
        workoutList,
        flash: req.flash(),
      });
    };

    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
          errors.array().forEach(message => req.flash("error", message.msg));
          rerenderEditList();
        } else if (await store.existsWorkoutListTitle(workoutListTitle)) {
          req.flash("error", "The category title must be unique.");
          rerenderEditList();
        } else {
          let updated = await store.setTodoListTitle(+workoutListId, workoutListTitle);
          if (!updated) throw new Error("Not found.");
  
          req.flash("success", "Workout list updated.");
          res.redirect(`/lists/${workoutListId}`);
        }
      } catch (error) {
        if (store.isUniqueConstraintViolation(error)) {
          req.flash("error", "The category title must be unique.");
          rerenderEditList();
        } else {
          throw error;
        }
      }
    })
  );

// Render the Sign In page.
app.get("/users/signin", (req, res) => {
    req.flash("info", "Please sign in.");
    res.render("signin", {
      flash: req.flash(),
    });
  });

  // Handle Sign In form submission
app.post("/users/signin",
catchError(async (req, res) => {
  let username = req.body.username.trim();
  let password = req.body.password;

  let authenticated = await res.locals.store.authenticate(username, password);
  if (!authenticated) {
    req.flash("error", "Invalid credentials.");
    res.render("signin", {
      flash: req.flash(),
      username: req.body.username,
    });
  } else {
    let session = req.session;
    session.username = username;
    session.signedIn = true;
    req.flash("info", "Welcome!");
    res.redirect("/lists");
  }
})
);

// Handle Sign Out
app.post("/users/signout", (req, res) => {
    delete req.session.username;
    delete req.session.signedIn;
    res.redirect("/users/signin");
  });

// Error handler
app.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send(err.message);
});

// Listener
app.listen(port, host, () => {
  console.log(`Todos is listening on port ${port} of ${host}!`);
});

