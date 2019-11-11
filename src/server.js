"use strict"
import express from "express";
import UserRouter from "./routes/UserRouter.js";

const PORT = process.env.PORT || 5000;
var app = express();

app.use(express.json());
app.use(UserRouter);


app.listen(PORT, function logMessage(){
    console.log("App is online running on http://127.0.0.1:%s", PORT)
})

