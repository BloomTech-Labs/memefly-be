var userRouter = require("express").Router()
var {UserModel} = require("../models")
var bcrypt = require("bcrypt");
var config = require("dotenv").config()
var jwt = require("jsonwebtoken");
try{
    var privateKey = config.parsed.privateKey
}catch(error){
    var privateKey = process.env.privateKey;
}

function registerCheck({
    body:{
            email, 
            firstName, 
            lastName, 
            userName, 
            password

        }}, response, next){

    if(
        email != undefined &&
        firstName != undefined &&
        lastName != undefined &&
        userName != undefined &&
        password != undefined
    ){ next() }
    else{
        response.status(400).json({message:"Bad request check request body"});
    }
}

function loginCheck({body:{email, password}}, response, next){
    if(
        email != undefined && 
        password != undefined
      ){ next() }
      else{
        response.status(400).json({message:"Bad request check request body"});
      }
}

userRouter.
    route("/register"). 
        all(registerCheck).
            post((request, response) => {

                bcrypt.hash(request.body.password, 8).
                    then(hash => {
                        //create document if hash successful 
                        UserModel.
                            create({...request.body, password:hash}). 
                                then(result => {

                                    response.status(201).json({message:"Created", user:result});
                                }). 
                                    catch(error => {
                                        //check for unique constraint
                                        if(error.code == 11000){
                                            response.status(400).json({"error": "Username/email already taken"});
                                        }else{
                                            response.status(500).json({"error":error});
                                        }
                                    }) 
                    }). 
                        catch(error => {
                            response.status(500).json({"error":error});
                        })
                    
            });
userRouter.
    route("/login").
        all(loginCheck).
           post(({body:{email, password}}, response) => {
                //find user
                UserModel.
                    findOne({email}). 
                        then(result => {
                            if (result == null){
                                response.status(400).json({message:"Invalid email/password"});
                            }else{
                                bcrypt.compare(password, result.password). 
                                    then(valid => {
                                        if(valid){
                                            jwt.sign({email}, privateKey, {expiresIn:"1h"}, (error, token) => {
                                                if(error){
                                                    response.status(500).json({"error":error}); 
                                                }else{
                                                    //final stop if all goes well
                                                    response.status(200).json({message:"logged in", token});
                                                }   
                                            })
                                        }else{
                                            response.status(400).json({message:"Invalid email/password"});
                                        }
                                    }). 
                                        catch(error => {
                                            response.status(500).json({"error":error});                       
                                        })
                            }
                        }). 
                            catch(error => {
                                response.status(500).json({"error":error});
                            })

           })
        

module.exports = userRouter;