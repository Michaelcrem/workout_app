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

# Accessing The Database 
The node-postegress module is imported in the application in order for the client to connect to the workout database. Once the connection between the client and the database has been made, the pg-persistence file will communicate with the workout database to issue SQL commands in order to update user data stored in the database. When the user enters new workout data through a form, the post request is sent to the server and that data stored in the request object is interpolated within the asynchronous command from the pg-persistence  file and used within the SQL command in the workout database.   






 
