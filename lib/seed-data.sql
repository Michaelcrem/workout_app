INSERT INTO workoutlists (id, title, username)
  VALUES (1, 'Arms', 'admin'),
         (2, 'Legs', 'admin');

-- Note: in the following statement, get the todo list IDs from
-- the todolists table. If the todo list IDs are 1, 2, 3, and 4, then our code looks like this:
INSERT INTO workouts (title, done, workoutlist_id, num_sets, num_reps, num_time, num_weight, username)
  VALUES ('Curls', FALSE, 1, 3, 10, 'N/A', 'N/A', 'admin'),
         ('Dips', TRUE, 1, 3, 6, 'N/A', 'N/A', 'admin'),
         ('Calf Raises', FALSE, 2, 3, 20, 'N/A', 'N/A', 'admin'),
         ('Lunges', FALSE, 2, 4, 12, 'N/A', 'N/A', 'admin'),
         ('Squats', TRUE, 2, 3, 10, 'N/A', 'N/A', 'admin');