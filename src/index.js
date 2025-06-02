import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path: "/.env",
});

// Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    // If the app throws an error after starting
    app.on("error", (error) => {
      console.log("Server Connection Error", error);
      throw error;
    });

    // Start the Express server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    // Handle DB connection failure
    console.log("MONGO DB connection failed !!", error);
  });
