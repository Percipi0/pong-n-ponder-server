import express from "express";
import http from "http";
import cors from "cors";
import initApi from "./api/index.js";
import updater from "./updater.js";

const PORT = 1930;
const app = express();
const server = http.Server(app);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

updater(server);

const main = async () => {
  await initApi(app);
  server.listen(PORT, () => {
    console.log(`Pong n' Ponder API listening at http://localhost:${PORT}`);
  });
};
main();
