"use strict"
import express from "express";
import UserRouter from "./routes/UserRouter.js";

import cors from "cors";
const PORT = process.env.PORT || 5000;
var app = express();

app.use(cors());

app.use(express.json());
app.use("/api", UserRouter);


app.listen(PORT, function logMessage(){
    console.log("App is online running on http://127.0.0.1:%s", PORT)
})

