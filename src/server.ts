if (process.env.NODE_ENV != "production"){
    var dotenv = require("dotenv");
    dotenv.config()
}


const PORT = process.env.PORT || 5000;
import express, { request } from "express";
import AccountRouter from "./Routes/AccountRouter";

var app = express();
app.use("/",AccountRouter);
app.listen(PORT, () => {
    console.log(`server up and running *:${PORT}`);
})