// Load environment variables as the VERY FIRST thing before any imports
import "dotenv/config";

import app from "./app";
import { verifyEmailConfig } from "./utils/emailSend.utils";

// Initialize email configuration check
verifyEmailConfig();

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Hello from the secure server!");
    console.log("Response sent");
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log(`http://localhost:${port}`);
});