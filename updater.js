import Server from "socket.io";

export default (server) => {
  const io = new Server(server);

  let roomIds = {};

  io.on("connection", (socket) => {
    console.log("New client connection");

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      io.emit("playerLost", roomIds[socket.id]);
      if (typeof roomIds[socket.id] !== "undefined") {
        delete roomIds[socket.id];
      }
    });

    socket.on("roomUpdate", (msg) => {
      //console.log(socket.id);
      console.log(msg["id"] + ": " + msg["message"]);
      roomIds[socket.id] = msg["id"];
      io.emit("roomUpdate", msg);
    });
  });
};
