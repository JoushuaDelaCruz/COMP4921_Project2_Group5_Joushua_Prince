const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 12;
const db_users = include("database/db_users");
const cloudinary = include("database/modules/cloudinary");
const expireTime = 60 * 60 * 1000; //expires after 1 hr (hours * minutes * seconds * millis)

router.post("/", async (req, res) => {
  const sessionID = req.body.data;
  req.sessionStore.get(sessionID, async (err, session) => {
    if (err) {
      console.error("Error while getting session:", err);
      res.send(null);
      return;
    }
    if (!session) {
      res.send(null);
      return;
    }
    if (!session.authenticated) {
      res.send(null);
      return;
    }
    const user = await db_users.getUserById(session.user);
    res.send(user);
  });
});

router.post("/checkSession", async (req, res) => {
  const sessionID = req.body.data;
  req.sessionStore.get(sessionID, (err, session) => {
    if (err) {
      console.error("Error while checking session:", err);
      res.send(false);
      return;
    }
    if (!session) {
      res.send(false);
      return;
    }
    res.send(session.authenticated);
  });
});

router.post("/create", async (req, res) => {
  const username = req.body.data.username;
  const email = req.body.data.email;
  const password = req.body.data.password;
  const image = await cloudinary.getRandomImage();
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const success = await db_users.create({
    username: username,
    email: email,
    password: hashedPassword,
    image: image,
  });
  if (success) {
    res.send(true);
    return;
  } else {
    res.send(false);
    return;
  }
});

router.post("/login", async (req, res) => {
  const email = req.body.data.email;
  const password = req.body.data.password;
  const user = await db_users.getUserByEmail(email);
  if (!user) {
    res.send(null);
    return;
  }
  if (bcrypt.compareSync(password, user.password)) {
    req.session.user = user.user_id;
    req.session.authenticated = true;
    req.session.cookie.maxAge = expireTime;
    console.log("Session created:", req.sessionID);
    res.send(req.sessionID);
    return;
  }
  res.send(null);
  return;
});

router.post("/isUsernameExist", async (req, res) => {
  const username = req.body.data;
  if (!username) {
    res.send(false);
    return;
  }
  try {
    const isExist = await db_users.isUsernameExist(username);
    res.send(isExist);
  } catch (error) {
    console.error("Error while checking username:", error);
    res.send(false);
  }
});

router.post("/isEmailExist", async (req, res) => {
  const email = req.body.data;
  if (!email) {
    res.send(false);
    return;
  }
  try {
    const isExist = await db_users.isEmailExist(email);
    res.send(isExist);
  } catch (error) {
    console.error("Error while checking email:", error);
    res.send(false);
  }
});

module.exports = router;
