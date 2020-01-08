const PORT = process.env.PORT || 5000;
import express from "express";
import AccountRouter from "./Routes/AccountRouter";
import BaseMemesRouter from "./Routes/GenMemeRouter";
import cors from "cors"
var app = express();
app.use(express.json({limit: '50mb'}));
app.use(cors())
app.use("/api",AccountRouter);
app.use("/api", BaseMemesRouter);
app.use("/api/memes/base",function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "https://memefly.netlify.com/");
    res.header("Access-Control-Allow-Origin", "https://memeflyai.com/");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.listen(PORT, () => {
    console.log(`server up and running *:${PORT}`);
})