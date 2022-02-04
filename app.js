const express = require("express");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`Database Error :  ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Register

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const userSelectQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const userDetails = await db.get(userSelectQuery);

  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (userDetails === undefined) {
    const newUser = `INSERT INTO 
     user(username, name, password, gender, location)
     VALUES('${username}', 
     '${name}',
      '${hashedPassword}', 
      '${gender}', 
      '${location}');`;
    await db.run(newUser);
    response.status(200);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// LOG IN

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userSelectQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const userDetails = await db.get(userSelectQuery);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//Change Password

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userSelectQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const userDetails = await db.get(userSelectQuery);
  if (userDetails !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (isPasswordMatched) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
      UPDATE user SET password ='${hashedPassword}'`;
      const passwordUpdated = await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
