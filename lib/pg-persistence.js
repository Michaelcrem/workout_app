// const SeedData = require("./seed-data");
// const deepCopy = require("./deep-copy");
// const { sortTodoLists, sortTodos } = require("./sort");
// const nextId = require("./next-id");
//const { Client } = require("pg");
const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");


module.exports = class PgPersistence {

  constructor(session) {
    this.username = session.username;
  }
  

  // Are all of the todos in the todo list done? If the todo list has at least
  // one todo and all of its todos are marked as done, then the todo list is
  // done. Otherwise, it is undone.
  isDoneWorkoutList(workoutList) {
    return workoutList.workouts.length > 0 && workoutList.workouts.every(workout => workout.done);
  }

  // Returns a promise that resolves to a sorted list of all the todo lists
  // together with their todos. The list is sorted by completion status and
  // title (case-insensitive). The todos in the list are unsorted.
  async sortedWorkoutLists() {
    const ALL_WORKOUTSLISTS = "SELECT * FROM workoutlists WHERE username = $1 ORDER BY lower(title) ASC";
    const FIND_WORKOUTS = "SELECT * FROM workouts WHERE workoutlist_id = $1";

    let result = await dbQuery(ALL_WORKOUTSLISTS, this.username);
    let workoutLists = result.rows;

    for (let index = 0; index < workoutLists.length; ++index) {
      let workoutList = workoutLists[index];
      let workouts = await dbQuery(FIND_WORKOUTS, workoutList.id);
      workoutList.workouts = workouts.rows;
    }

    return this._partitionWorkoutLists(workoutLists);
  }

  // Returns a new list of todo lists partitioned by completion status.
  _partitionWorkoutLists(workoutLists) {
    let undone = [];
    let done = [];

    workoutLists.forEach(workoutList => {
      if (this.isDoneWorkoutList(workoutList)) {
        done.push(workoutList);
      } else {
        undone.push(workoutList);
      }
    });

    return undone.concat(done);
  }

  // Returns a promise that resolves to the todo list with the specified ID. The
  // todo list contains the todos for that list. The todos are not sorted. The
  // Promise resolves to `undefined` if the todo list is not found.
  async loadWorkoutList(workoutListId) {
    const FIND_WORKOUTLIST = "SELECT * FROM workoutlists WHERE id = $1 AND username = $2";
    const FIND_WORKOUTS = "SELECT * FROM workouts WHERE workoutlist_id = $1 AND username = $2";

    let resultWorkoutList = dbQuery(FIND_WORKOUTLIST, workoutListId, this.username);
    let resultWorkouts = dbQuery(FIND_WORKOUTS, workoutListId, this.username);
    let resultBoth = await Promise.all([resultWorkoutList, resultWorkouts]);

    let workoutList = resultBoth[0].rows[0];
    if (!workoutList) return undefined;

    workoutList.workouts = resultBoth[1].rows;
    return workoutList;
  }

  // Does the todo list have any undone todos? Returns true if yes, false if no.
  hasUndoneWorkouts(workoutList) {
    return workoutList.workouts.some(workout => !workout.done);
  }

   // Returns a promise that resolves to a sorted list of all the todos in the
  // specified todo list. The list is sorted by completion status and title
  // (case-insensitive).
  async sortedWorkouts(workoutList) {
    const SORTED_WORKOUTS = "SELECT * FROM workouts" +
                         "  WHERE workoutlist_id = $1 AND username = $2" +
                         "  ORDER BY done ASC, lower(title) ASC";

    let result = await dbQuery(SORTED_WORKOUTS, workoutList.id, this.username);
    return result.rows;
  }

  // Returns a copy of the indicated todo in the indicated todo list. Returns
  // `undefined` if either the todo list or the todo is not found. Note that
  // both IDs must be numeric.
  async loadWorkout(workoutListId, workoutId) {
    const FIND_TODO = "SELECT * FROM workouts WHERE workoutlist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(FIND_TODO, workoutListId, workoutId, this.username);
    return result.rows[0];
  }

  // Toggle a todo between the done and not done state. Returns a promise that
  // resolves to `true` on success, `false` if the todo list or todo doesn't
  // exist. The id arguments must both be numeric.
  async toggleDoneWorkout(workoutListId, workoutId) {
    const TOGGLE_DONE = "UPDATE workouts SET done = NOT done" +
                        "  WHERE workoutlist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(TOGGLE_DONE, workoutListId, workoutId, this.username);
    return result.rowCount > 0;
  }


  // Delete a todo from the specified todo list. Returns a promise that resolves
  // to `true` on success, `false` on failure.
  async deleteWorkout(workoutListId, workoutId) {
    const DELETE_WORKOUT = "DELETE FROM workouts WHERE workoutlist_id = $1 AND id = $2 AND username = $3";

    let result = await dbQuery(DELETE_WORKOUT, workoutListId, workoutId, this.username);
    return result.rowCount > 0;
  }

  // Mark all todos in the specified todo list as done. Returns a promise that
  // resolves to `true` on success, `false` if the todo list doesn't exist. The
  // todo list ID must be numeric.
  async completeAllWorkouts(workoutListId) {
    const COMPLETE_ALL = "UPDATE workouts SET done = TRUE" +
                         "  WHERE workoutlist_id = $1 AND NOT done" +
                         "    AND username = $2";

    let result = await dbQuery(COMPLETE_ALL, workoutListId, this.username);
    return result.rowCount > 0;
  }

  // Create a new todo with the specified title and add it to the indicated todo
  // list. Returns a promise that resolves to `true` on success, `false` on
  // failure.
  async createWorkout(workoutListId, title, num_sets, num_reps, num_time, num_weight) {
    const CREATE_WORKOUT = "INSERT INTO workouts" +
                        "  (title, workoutlist_id, num_sets, num_reps, num_time, num_weight, username)" +
                        "  VALUES ($1, $2, $3, $4, $5, $6, $7)";

    let result = await dbQuery(CREATE_WORKOUT, title, workoutListId, num_sets, num_reps, num_time, num_weight, this.username);
    return result.rowCount > 0;
  }

  // Delete a todo list and all of its todos (handled by cascade). Returns a
  // Promise that resolves to `true` on success, false if the todo list doesn't
  // exist.
  async deleteWorkoutList(workoutListId) {
    const DELETE_WORKOUTLIST = "DELETE FROM workoutlists WHERE id = $1 AND username = $2";

    let result = await dbQuery(DELETE_WORKOUTLIST, workoutListId, this.username);
    return result.rowCount > 0;
  }

  // Set a new title for the specified todo list. Returns a promise that
  // resolves to `true` on success, `false` if the todo list wasn't found.
  async setTodoListTitle(todoListId, title) {
    const UPDATE_TITLE = "UPDATE workoutlists SET title = $1 WHERE id = $2 AND username = $3";

    let result = await dbQuery(UPDATE_TITLE, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Returns a Promise that resolves to `true` if a todo list with the specified
  // title exists in the list of todo lists, `false` otherwise.
  async existsWorkoutListTitle(title) {
    const FIND_WORKOUTLIST = "SELECT null FROM workoutlists WHERE title = $1 AND username = $2";

    let result = await dbQuery(FIND_WORKOUTLIST, title, this.username);
    return result.rowCount > 0;
  }

  // Returns `true` if `error` seems to indicate a `UNIQUE` constraint
  // violation, `false` otherwise.
  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  // Create a new todo list with the specified title and add it to the list of
  // todo lists. Returns a Promise that resolves to `true` on success, `false`
  // if the todo list already exists.
  async createWorkoutList(title) {
    const CREATE_TODOLIST = "INSERT INTO workoutlists (title, username) VALUES ($1, $2)";

    try {
      let result = await dbQuery(CREATE_TODOLIST, title, this.username);
      return result.rowCount > 0;
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) return false;
      throw error;
    }
  }

  // Returns a Promise that resolves to `true` if `username` and `password`
  // combine to identify a legitimate application user, `false` if either the
  // `username` or `password` is invalid.
  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM users" +
                                 "  WHERE username = $1";

    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

};