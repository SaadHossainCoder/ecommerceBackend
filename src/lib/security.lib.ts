// import arcjet, { detectBot, tokenBucket } from "@arcjet/node";

// const aj = arcjet({
//   key: process.env.ARCJET_KEY!,
//   rules: [
    
//     detectBot({
//       mode: "LIVE",
//       allow: [
//         "CATEGORY:SEARCH_ENGINE",
//       ],
//     }),

//     // tokenBucket({
//     //   mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
//     //   characteristics: ["userId"], // track requests by a custom user ID
//     //   refillRate: 5, // refill 5 tokens per interval
//     //   interval: 10, // refill every 10 seconds
//     //   capacity: 10, // bucket maximum capacity of 10 tokens
//     // }),
//   ],

// })

// export default aj;