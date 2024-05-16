import express from "express";
import route from "./router.js";
import {connect} from "mongoose";

connect("mongodb+srv://Mohamedali:CtcaK1o4EAUuTTkF@cluster0.4s0eokr.mongodb.net/Paris")
    .then(function(){
        console.log("Connexion MongoDB réussie")
    })
    .catch(function(err){
        console.log(new Error(err))
    })

const app = express();
const PORT = 1235;

app.use(express.json()); 

app.use(route);

app.listen(PORT,function() {
    console.log(`serveur express d'écoute sur le port ${PORT}`)
})
