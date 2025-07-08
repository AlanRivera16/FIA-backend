import express from 'express';
import mongoose from 'mongoose';
import {monstrarMesaje} from './funciones.js'
import {MONGODB_URI} from './src/config.js'

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


// var numero;
// const numero2 = 1 


// function sumarNumeros(){
//     var num1 = 1
//     var num2 = 2
//     var suma = num1 + num2 

//     console.log(suma)
        //function hoaPequeño(){}
// }

// const resultadoDeMiFunction = sumarNumeros()


// function buenastArdecls(){
//     console.log("Hola buenas tardes")
// }

monstrarMesaje()
// resultadoDeMiFunction





