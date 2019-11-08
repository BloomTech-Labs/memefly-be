const PORT = process.env.PORT || 5000;
var express = require("express");
var cors = require("cors");
var userRouter = require("./routes/userRouter.js");
var server = express();


server.use(express.json());
server.use(cors());
server.use(userRouter);
server.
    listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
