const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT || 3001;
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/AuthRoutes");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const bodyParser = require("body-parser");

app.use(
  cors({
    origin: ["https://justchatting.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "50mb", type: "application/json" }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/", authRoutes);
app.use(express.urlencoded({ extended: true }));

dotenv.config({
  path: "./.env",
});

const DB = process.env.DATABASE_URL;
console.log(DB);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connection Success!");
  })
  .catch((err) => {
    console.log(err);
  });

const io = new Server(server, {
  cors: {
    origin: "https://justchatting.vercel.app/",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
});

const users = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    Object.keys(users).map((user) => {
      if (users[user].socketId === socket.id) {
        delete users[user];
      }
    });

    io.emit("all_users", users);
  });

  socket.on("force-disconnect", () => {
    Object.keys(users).map((user) => {
      if (users[user].socketId === socket.id) {
        delete users[user];
      }
    });

    io.emit("all_users", users);
  });

  socket.on("new_user", ({ username, imageUrl }) => {
    // users[username] = socket.id;
    users[username] = { imageUrl, socketId: socket.id, username };
    //we can tell every other users someone connected
    io.emit("all_users", users);
  });

  socket.on("send_message", (data) => {
    const socketId = users[data.receiver].socketId;
    io.to(socketId).emit("new_message", data);
  });
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

server.listen(port, () => {
  console.log("server is up and running on port " + port);
});
