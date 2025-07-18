import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config();

// Connect to MongoDB, then start the server
connectDB()
  .then(() => {
    // If the app throws an error after starting
    app.on("error", (error) => {
      console.log("Server Connection Error", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000, "0.0.0.0", () => {
      console.log(`Server is running at port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    // Handle DB connection failure
    console.log("MONGO DB connection failed !!", error);
  });
