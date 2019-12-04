const PORT = process.env.PORT || 5000;
import express from "express";
import AccountRouter from "./Routes/AccountRouter";
import BaseMemesRouter from "./Routes/BaseMemesRouter";

var app = express();
app.use("/api",AccountRouter);
app.use("/api", BaseMemesRouter);
app.listen(PORT, () => {
    console.log(`server up and running *:${PORT}`);
})