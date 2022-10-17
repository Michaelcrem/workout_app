CREATE TABLE workoutlists (
  id serial PRIMARY KEY,
  title text NOT NULL UNIQUE
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  num_sets text NOT NULL DEFAULT 'N/A',
  num_reps text NOT NULL DEFAULT 'N/A',
  num_time text NOT NULL DEFAULT 'N/A',
  num_weight text NOT NULL DEFAULT 'N/A',
  done boolean NOT NULL DEFAULT false,
  workoutlist_id integer
    NOT NULL
    REFERENCES workoutlists (id)
    ON DELETE CASCADE
);

UPDATE workouts SET num_sets = 'N/A' WHERE num_sets = '';
UPDATE workouts SET num_reps = 'N/A' WHERE num_reps = '';
UPDATE workouts SET num_time = 'N/A' WHERE num_time = '';
UPDATE workouts SET num_weight = 'N/A' WHERE num_weight = '';