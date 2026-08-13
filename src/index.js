// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/dbconnection.js";
import { app } from "./app.js"

dotenv.config({
  path: "./env",
});

const port = process.env.PORT;

connectDB()
  .then(() => {
    // app.on("error", (error) => {
    //     console.log("ERROR: ", error);
    //     throw error
    // });

    app.listen(port || 8000, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed !!! ", err);
  });

/*
IIFE Code to connect to Database

import express from "express";

const app = express();

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch(error){
        console.log("ERROR: ", error);
        throw error;
    }
})()

*/
