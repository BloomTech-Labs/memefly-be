const PORT = process.env.PORT || 5000;
import express from "express";

let app = express();

app.listen(PORT, () => {
    console.log(`server up and running *:${PORT}`);
})