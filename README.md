# workout_app

A full-stack C.R.U.D. application that uses the Express framework in order to handle incoming requests from the browser and PostgreSQL database integretion  so data can be managed through various SQL statements from the pg-persistence file used to communicate with the locally stored database. Users are required to log in to the application, and access their private workout routines. 

Full Stack project: https://workout----tracker123.herokuapp.com

## For Testing/Login
 * Username: developer
 * Password: letmein

## Schema Design 

The project consists of three entities, the workout lists, the specific workouts, and the users. There is a one to many relationship between the workout list (the one), and the workouts (many). Where one workout list can contain many workouts. The username table is used to keep track of users and their own private workouts after sucessful authentication through the sign in page.

### workout list
 * Each workout list has an id number as a primary key.
 * Each workout list has a unique title.
 * Each workout list has a username

### workouts
 * Each workout has an id number as a primary key.
 * Each workout has a title. The title doesn't have to be unique.
 * Each workout can be either done or undone. Undone is the default state for new workouts.
 * Each username has a username 
 * Each workout belongs to a workout list. This relationship uses a foreign key that references the workout list.

### users
 * Each user has to have a username
 * Each user has to have a password

## Accessing The Database / Managing Data 
The node-postegress module is imported in the application in order for the client to connect to the workout database. Once the connection between the client and the database has been made (async), the pg-persistence file can then communicate with the workout database in order to issue the SQL commands to the workout database. Once the query runs, and the promise has been fulfiled, the client will then disconnect from the database. 

The user will first send a request through the browser, then any values in the request object are used in the method calls from the pg-persistence file where data from the request object is interpolated as an SQL command and queried to the workout database. The result is then returned back to the browser and the user is able to see their own private individual workouts. 

## Routes 
The user first has to log in to acess their own private workouts. Authentication is used first on the sign in page where the users name and password are stored in the database. Once sucesfully logged in, the user is routed to the workout list page where they will see their own private workouts after the pg-persistence file issued a query to obtain all workout lists for the username. If the user does not have any lists they can either create a new list with the new list button, where a request will be issued and they will be routed to create a new list page via the static asset new list button, or if they click on a list already made on the workout list page, they will be routed to the edit workout page. The workout page also consists of satic assest such as buttons that have connectivity to the database via the pg persistence file.  








 
