// import dotenv and configure 
// This should be the very first thing in your application

import app from "./app";
import dotenv from "dotenv";
dotenv.config();

const port = "3000";

app.get("/", (req, res) => {
    res.send("Hello from the secure server!");
    console.log("Response sent");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});