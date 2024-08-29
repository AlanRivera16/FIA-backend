import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const mongoUri = process.env.MONGODB_URI

export async function connectDB() {
  try {
    mongoose
      .connect(mongoUri)
      .then(() => {
        // console.log("Connected to MongoDB");
      })
  } catch (err) {
    console.log(err);
  }
}