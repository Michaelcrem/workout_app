CREATE TABLE workoutlists (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE,
  username text NOT NULL
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  num_sets text NOT NULL DEFAULT 'N/A',
  num_reps text NOT NULL DEFAULT 'N/A',
  num_time text NOT NULL DEFAULT 'N/A',
  num_weight text NOT NULL DEFAULT 'N/A',
  done boolean NOT NULL DEFAULT false,
  username text NOT NULL,
  workoutlist_id integer
    NOT NULL
    REFERENCES workoutlists (id)
    ON DELETE CASCADE
);

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL
);