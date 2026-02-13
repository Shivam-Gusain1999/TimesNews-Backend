import {connectDB} from "./config/db.js"; 
import app from "./app.js";
const PORT = process.env.PORT || 5000;


connectDB()
.then(() => {
    // Jab DB connect ho jaye, tabhi server sunna shuru karega
    app.listen(PORT, () => {
        console.log(`
       
     Server is running at port : ${PORT}
       
        `);
    });

    // Optional: Agar server start hone ke baad koi error aye (jaise Port Busy)
    app.on("error", (error) => {
        console.error("Server Error:", error);
        throw error;
    });
})
.catch((err) => {
    console.error("MONGO db connection failed !!! ", err);
    process.exit(1); // Server band kar do agar DB hi nahi chala
});