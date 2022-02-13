const app = require("express")();
const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// unique id
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const users = {};
const game = {};
let counter = {};
let turn = "";
let interval = [];
// middle ware
io.use((socket, next) => {
  let user = {
    address: socket.handshake.auth.address,
  };
  users[socket.id] = user;
  next();
});

io.on("connection", (socket) => {
  console.log("iam connected");
  io.emit("list", users);

  socket.on("create", (res) => {
    const gameid = randomId();
    let data = {
      white: socket.id,
      whiteUsername: socket.handshake.auth.address,
    };
    game[gameid] = data;
    console.log(res);
    let id = socket.id;
    delete users[socket.id];
    io.emit("list", users);
    io.to(res).emit("create", { gameid, id });
  });

  socket.on("join", ({ gameid, id, myid }) => {
    let data = game[gameid];
    data["black"] = socket.id;
    data["blackUsername"] = socket.handshake.auth.address;
    data["gameid"] = gameid;
    game[gameid] = data;
    counter[gameid] = { w: 0, b: 0 };
    delete users[socket.id];
    io.emit("list", users);
    io.to(id).to(myid).emit("join", game[gameid]);
  });
  socket.on("counter", ({ myid, otherid, gameid }) => {
    interval[gameid] = setInterval(() => {
      if (turn == "w") counter[gameid]["w"]++;
      else if (turn == "b") counter[gameid]["b"]++;
      console.log(counter, myid, otherid);
      io.to(myid).to(otherid).emit("counter", counter[gameid]);
    }, 1000);
  });

  socket.on("move", (res) => {
    turn = res.userturn;
    io.to(res.otherid).emit("move", res);
    console.log(res);
  });

  socket.on("disconnect", () => {
    console.log(game, socket.id);
    // clearInterval(interval)
    // counter={w: 0, b: 0}
    console.log("disconnect");
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log("server is listening on port 8000");
});
