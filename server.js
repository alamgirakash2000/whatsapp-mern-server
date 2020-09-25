// Importing
// to write this import , we need add "type: module" at package.json
import express from "express";
import mongoose from "mongoose";
import Pusher from "pusher";
import Messages from "./dbMessages.js";
import cors from "cors";
import Users from "./user.js";

// app config
const app = express();
const port = process.env.PORT || 9000;
// To get the realtime purposes
const pusher = new Pusher({
  appId: "1068171",
  key: "4bccf108508cfaa75620",
  secret: "009b8157455561e397a3",
  cluster: "mt1",
  encrypted: true,
});
const db = mongoose.connection;
db.once("open", () => {
  console.log("DB is connected");
  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        receive: messageDetails.receive,
      });
    } else {
      console.log("Error Occured");
    }
  });
});

//  middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url =
  "mongodb+srv://akash:xlWQ6xIEkJfxKIMc@cluster0.of9jp.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
//???

// api routes

// Getting
app.get("/messages/:pid", async (req, res) => {
  const userId = req.params.pid;
  let send = [];
  let received = [];

  await Messages.find({ sender: userId }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      send = data;
    }
  });

  await Messages.find({ receiver: userId }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      received = data;
    }
  });

  res.status(200).send([...send, ...received]);
});

app.get("/users", async (req, res, next) => {
  let users;
  try {
    users = await Users.find({}, "-password");
  } catch (err) {
    res.status(500).send(err);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await Users.findOne({ email: email });
  } catch (err) {
    res.status(500).send("Signup failed, please try again later.");
  }

  if (!existingUser) {
    res.status(500).send("You have no account, Please create first");
  }

  if (existingUser.password !== password) {
    res.status(401).send("Wrong password, please try again.");
  }

  res.json({ user: existingUser.toObject({ getters: true }) });
});

// Posting
app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

app.post("/users/new", (req, res) => {
  const newUser = req.body;

  Users.create(newUser, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listener
app.listen(port, () => console.log(`Listening on localhost ${port}`));
