import express from 'express';
import cors from 'cors';
import { connectDB } from './src/utils/conection-database.js'
import { register, login } from './src/controllers/authControllers.js';
import authRoutes from './src/routes/authRoutes.js';
import usuariosRoute from './src/routes/usuarios.route.js'
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(cors());

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//settings routes
app.post('/register', register);
app.post('/login', login);

app.get('/', (req,res) => {
    res.send('Bienvenido a servidor REST de ALAN');
});
app.get('/users', (req,res) => {
    res.send('Lista de usuarios');
});

app.use(authRoutes);
app.use(usuariosRoute);

// mongoose
//   .connect(mongoUri)
//   .then(() => {
//     console.log("Connected to MongoDB");
//   })
//   .catch((error) => {
//     console.log({ error });
//   });
connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error)=>{
    console.log('Error connecting to MongoDB',error);
})


const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
