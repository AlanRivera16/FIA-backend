import express from 'express';
import mongoose from 'mongoose';
import {monstrarMesaje} from './funciones.js'

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect('mongodb+srv://financieraindependienteags:Ft9F1pU5PcVZ9PcK@cluster0.d0dysl4.mongodb.net/?retryWrites=true&w=majority')
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





