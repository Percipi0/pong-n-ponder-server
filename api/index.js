import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import prompts from "../utils/prompts.js";

let api = express.Router();

let Rooms;
let IDs = [];
let roomMap = {};

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/", api);

  let conn = await MongoClient.connect("mongodb://127.0.0.1");

  let db = conn.db("pongnponder");
  Rooms = db.collection("rooms");

  let roomArr = await Rooms.find(
    {},
    { _id: 0, id: 1, player1: 1, player2: 1, game: 1, chat: 1 }
  ).toArray();
  for (let i = 0; i < roomArr.length; i++) {
    IDs.push(roomArr[i]["id"]);
    roomMap[roomArr[i]["id"]] = [
      roomArr[i]["player1"],
      roomArr[i]["player2"],
      roomArr[i]["game"],
      roomArr[i]["chat"],
    ];
  }
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

api.get("/rooms/:id", (req, res) => {
  let id = req.params.id;
  if (IDs.includes(id)) {
    if ((roomMap[id][0] !== "") & (roomMap[id][1] !== "")) {
      res.status(400).json({ error: "room is full!" });
      return;
    }
    res.json({
      id: id,
      player1: roomMap[id][0],
      player2: roomMap[id][1],
      game: roomMap[id][2],
      chat: roomMap[id][3],
    });
  } else {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }
});

api.get("/update/:id", (req, res) => {
  let id = req.params.id;
  if (IDs.includes(id)) {
    res.json({
      id: id,
      player1: roomMap[id][0],
      player2: roomMap[id][1],
      game: roomMap[id][2],
      chat: roomMap[id][3],
    });
  } else {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }
});

api.use(bodyParser.json());
api.post("/rooms", (req, res) => {
  let id = req.body.id;
  let player1 = req.body.player1;
  let player2 = req.body.player2;
  let game = req.body.game;
  let chat = {};
  let messages = [];

  chat["messages"] = messages;

  let messageObj = {
    id: chat["messages"].length + 1,
    sender: player1,
    message: "has begun to ponder",
    notification: true,
  };

  chat["messages"].unshift(messageObj);

  let prompt = prompts[Math.floor(Math.random() * prompts.length)];
  chat["prompt"] = prompt;

  if (!Object.keys(req.body).includes("id") || id === "") {
    res.status(400).json({ error: "Missing id" });
    return;
  }

  if (IDs.includes(id)) {
    res.status(400).json({ error: id + " already exists" });
    return;
  }
  IDs.push(id);
  roomMap[id] = [player1, player2, game, chat];

  Rooms.insertOne({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
  res.json({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
});

api.patch("/rooms/:id", (req, res) => {
  let id = req.params.id;

  if (!IDs.includes(id)) {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }

  let player1 = req.body.player1;
  let player2 = req.body.player2;
  let game = roomMap[id][2];
  let chat = roomMap[id][3];

  if (player1 === player2) {
    res.status(400).json({ error: "name already taken!" });
    return;
  }

  let messageObj = {
    id: chat["messages"].length + 1,
    sender: player2,
    message: "has begun to ponder",
    notification: true,
  };

  chat["messages"].unshift(messageObj);

  Rooms.replaceOne(
    { id: id },
    {
      id: id,
      player1: player1,
      player2: player2,
      game: game,
      chat: chat,
    }
  );

  roomMap[id] = [player1, player2, game, chat];

  res.json({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
});

api.patch("/room_update/:id", (req, res) => {
  let id = req.params.id;

  if (!IDs.includes(id)) {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }

  let player1 = req.body.player1;
  let player2 = req.body.player2;
  let game = req.body.game;
  let chat = req.body.chat;

  Rooms.replaceOne(
    { id: id },
    {
      id: id,
      player1: player1,
      player2: player2,
      game: game,
      chat: chat,
    }
  );

  roomMap[id] = [player1, player2, game, chat];

  res.json({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
});

//add new message to messages and update room
api.patch("/room_update_message/:id", (req, res) => {
  let id = req.params.id;
  let sender = req.body.sender;
  let message = req.body.message;

  if (!IDs.includes(id)) {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }

  let player1 = roomMap[id][0];
  let player2 = roomMap[id][1];
  let game = roomMap[id][2];
  let chat = roomMap[id][3];

  let messageObj = {
    id: chat["messages"].length + 1,
    sender: sender,
    message: message,
    notification: false,
  };

  chat["messages"].unshift(messageObj);

  Rooms.replaceOne(
    { id: id },
    {
      id: id,
      player1: player1,
      player2: player2,
      game: game,
      chat: chat,
    }
  );

  roomMap[id] = [player1, player2, game, chat];

  res.json({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
});

//add new message to messages and update room
api.patch("/room_update_game/:id", (req, res) => {
  let id = req.params.id;
  let sender = req.body.sender;
  let message = req.body.message;

  if (!IDs.includes(id)) {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }

  let player1 = roomMap[id][0];
  let player2 = roomMap[id][1];
  let game = roomMap[id][2];
  let chat = roomMap[id][3];

  let messageObj = {
    id: chat["messages"].length + 1,
    sender: sender,
    message: message === "join" ? "is playing pong" : "has returned",
    notification: true,
  };

  chat["messages"].unshift(messageObj);

  Rooms.replaceOne(
    { id: id },
    {
      id: id,
      player1: player1,
      player2: player2,
      game: game,
      chat: chat,
    }
  );

  roomMap[id] = [player1, player2, game, chat];

  res.json({
    id: id,
    player1: player1,
    player2: player2,
    game: game,
    chat: chat,
  });
});

api.delete("/rooms/:id", (req, res) => {
  let id = req.params.id;
  if (!IDs.includes(id)) {
    res.status(404).json({ error: "No room with ID " + id });
    return;
  }

  delete roomMap[id];
  let idx = IDs.indexOf(id);
  IDs.splice(idx, 1);

  Rooms.deleteOne({ id: id });

  res.json({ success: true });
});

/* Catch-all route to return a JSON error if endpoint not defined. */
api.all("/*", (req, res) => {
  res
    .status(404)
    .json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

export default initApi;
