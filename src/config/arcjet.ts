// // src/config/arcjet.js
// import dotenv from "dotenv";
// dotenv.config();

// import arcjet, { detectBot, tokenBucket } from "@arcjet/node";

// if (!process.env.ARCJET_API_KEY) {
//     throw new Error("Cannot find `ARCJET_KEY` environment variable");
// }

// export const aj = arcjet({
//         characteristics: ['http.request.headers["user-agent"]', "ip.src"],
//         key: process.env.ARCJET_API_KEY!,

//         rules: [
//             detectBot({
//                 mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
//                 // Block all bots except the following
//                 allow: [
//                     "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
//                     // Uncomment to allow these other common bot categories
//                     // See the full list at https://arcjet.com/bot-list
//                     //"CATEGORY:MONITOR", // Uptime monitoring services
//                     //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
//                 ],
//             }),
//             tokenBucket({
//                 mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
//                 characteristics: ["userId"], // track requests by a custom user ID
//                 refillRate: 5, // refill 5 tokens per interval
//                 interval: 10, // refill every 10 seconds
//                 capacity: 10, // bucket maximum capacity of 10 tokens
//             }),
//         ],
//     });