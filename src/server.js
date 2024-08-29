// import express from 'express';
// import cors from 'cors';
// import mongoose from 'mongoose';
// import { connectDB } from './utils/conection-database.js'
// import { register, login } from './controllers/authControllers.js';
// import authRoutes from './routes/authRoutes.js';
// import dotenv from 'dotenv';
// dotenv.config();

// // app.use(cors());

// const app = express();

// //middlewares
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// //settings routes
// app.post('/register', register);
// app.post('/login', login);

// app.get('/', (req,res) => {
//     res.send('Bienvenido a servidor REST de ALAN');
// });
// app.get('/users', (req,res) => {
//     res.send('Lista de usuarios');
// });

// app.use(authRoutes);

// // const mongoUri = 'mongodb+srv://financieraindependienteags:Ft9F1pU5PcVZ9PcK@cluster0.d0dysl4.mongodb.net/?retryWrites=true&w=majority';
// const mongoUri = process.env.MONGODB_URI;

// // mongoose
// //   .connect(mongoUri)
// //   .then(() => {
// //     console.log("Connected to MongoDB");
// //   })
// //   .catch((error) => {
// //     console.log({ error });
// //   });
// connectDB()
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((error)=>{
//     console.log('Error connecting to MongoDB',error);
// })


// const port = process.env.PORT || 3000;

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
