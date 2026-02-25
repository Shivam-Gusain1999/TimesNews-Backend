import { connectDB } from "./config/db.js";
import app from "./app.js";
const PORT = process.env.PORT || 5000;


connectDB()
    .then(() => {
        // Ensure DB connection is established before starting the server
        app.listen(PORT, () => {
            console.log(`
       
     Server is running at port : ${PORT}
       
        `);
        });

        // Handle server-level errors like port conflicts after startup
        app.on("error", (error) => {
            console.error("Server Error:", error);
            throw error;
        });
    })
    .catch((err) => {
        console.error("MONGO db connection failed !!! ", err);
        process.exit(1); // Terminate process if database connection fails
    });