import dotenv from 'dotenv'
import connectDB from "./db/dbConnect.js";

dotenv.config({ 
    path: './env' 
})

const PORT = process.env.PORT || 5000;

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`server is running on port : ${PORT}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection Failed ",error);
})











/*
import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONG0DB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("error ",error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`app listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("Error connecting to MongoDB ", error);
        throw error;
    }
})()
*/