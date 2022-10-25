# workout_app

A full-stack C.R.U.D. application that uses the Express framework in order to handle incoming requests from the browser and PostgreSQL database integretion  so data can be managed through various SQL statements from the pg-persistence file used to communicate with the locally stored database. Users are required to log in to the application, and access their private workout routines. 

Full Stack project: https://workout----tracker123.herokuapp.com

# For Testing/Login
 * Username: developer
 * Password: letmein

# Schema Design 

The project consists of three entities, the workout lists, the specific workouts, and the users. There is a one to many relationship between the workout list (the one), and the workouts (many). Where one workout list can contain many workouts. 

### workout list
 * Each workout list has an id number as a primary key.
 * Each workout list has a unique title.

### workouts
 * Each workout has an id number as a primary key.
 * Each workout has a title. The title doesn't have to be unique.
 * Each workout can be either done or undone. Undone is the default state for new workouts.
 * Each workout belongs to a workout list. This relationship uses a foreign key that references the workout list.

# Accessing The Database / Obtaining Values
We use the node-postegress module in our application to acess the PostgreSQL database in order for the workout data base to be created and data to be stored and managed by the workout database. The pg-persistence file will then will communicate with the wokout database with various functions that will update the data that is stored in the workout database. These functions, such as createWorkout, loadWrokout, or deleteWorkoutList all have different functionalities related to updateing the data stored in the database. These functions have string interpolated SQL commands where values passed into the functions (user values), will be interpolated into the command and so data can then be created, read, updated, and deleted when the user   






 
