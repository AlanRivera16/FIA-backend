import bcrypt from 'bcrypt';
import Usario from '../models/usuario.model.js'

// Función para registrar un usuario
const DB_Simulator = [
    {name: "Alan", email:"rivera.alan@gmail,com", password:"Cada1DeNosotros"}
]

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Aquí deberías validar los campos enviados en el cuerpo de la solicitud

  // Verificar si el usuario ya existe en la base de datos
  // ...
  const existingUser = DB_Simulator.filter(reg => reg.email == email)[0]

//   existingUser?console.log('Si tengo datos'):console.log('No tengo datos')
// !existingUser.length?console.log('Si estoy vacío'):console.log('No estoy vacío')

  // Si el usuario ya existe, devolver un error
  if (existingUser) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  // Si el usuario no existe, procedemos a crearlo
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Ha ocurrido un error interno' });
    }

    const user = {
      name,
      email,
      password: hashedPassword
    };

    // Guardar el usuario en la base de datos
    DB_Simulator.push(user)
    console.log(DB_Simulator)
    // ...

    res.status(201).json({ user });
  });
}

// Función para iniciar sesión
export const login = async(req, res) => {
  const { email, password } = req.body;

  // Aquí deberías validar los campos enviados en el cuerpo de la solicitud

  // Buscar al usuario en la base de datos
  const user = DB_Simulator.filter(reg => reg.email == email)[0]
  //   console.log(user)
  // ...

  // Si el usuario no existe, devolver un error
  if (!user) {
    return res.status(401).json({ message: 'El usuario y contraseña no existen' });
  }

  // Comparar la contraseña proporcionada con la contraseña almacenada en la base de datos
  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) {
      return res.status(500).json({ message: 'Ha ocurrido un error interno' });
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'El usuario o la contraseña son incorrectos' });
    }

    res.status(200).json({ user });
    console.log("Usuario encontrado, logeo exitoso!")
  });
}

export const loginUser = async(req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await Usario.find({ deleteStatus:false });
    const findUser = usuario.filter(user => user.email == email && user.password == password)[0]

    if(findUser){
      res.status(200).send({findUser});
    }else{
      // res.status(401).json({ message: 'El usuario o la contraseña son incorrectos' });
      res.send({error:'El correo o contraseña son incorrectos'})
    }
    // res.status(200).json({findUser});
    // res.send(findUser);
    
  } catch (error) {
    res.status(500).send(error);
  }
}
