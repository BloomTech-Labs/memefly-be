"use strict"
import express from "express";
import graphqlHTTP from "express-graphql";
import { importSchema } from 'graphql-import'
import { makeExecutableSchema } from 'graphql-tools';
import bcrypt from "bcrypt";
import {AccountModel, validatePassword} from "../models";
import {privateKey} from "../../configVars.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";

var typeDefs = importSchema("./src/graphql/schema.graphql");

function verifyTokenPredicate(_cookie){
    var {token, _id} = cookie.parse(_cookie)
    return new Promise(function (resolve, reject){
        jwt.verify(token, privateKey, (error, token) => {
            if(error){
                reject(false)
            }else{
                resolve(token._id == _id);
            }
        })
            
    })
}


var root = {
    async login({username, email, password}, context){
        var loginType;
        //so user can log in with either email or username;
        if(username != undefined && email == undefined) loginType = "username";
        if(username == undefined && email != undefined) loginType = "email";
        if(username != undefined && email != undefined) loginType = "email";//default to email if they are both in body
        if(username == undefined && email == undefined) return "Malformed Query need either email/username"
        var account = await AccountModel.findOne({[loginType]:loginType  == "email" ? email:username});

        if(account != null){
            var valid = await bcrypt.compare(password, account.password);
            if(valid){
                var token = await jwt.sign({_id:account._id}, privateKey, {expiresIn:"1h"})// token is a signed object with account id
                if(token){
                    await context.response.cookie("token", token); 
                    await context.response.cookie("_id", `${account._id}`);
                    return "logged in";
                }
            }else{
                return "Invalid Credentials"
            }
        }else{
            return "Invalid Credentials"
        }
               
    },
    async register({username, email, password}){
        var message;
        if(!validatePassword(password)){
            return "password must be at least 8 characters long, must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number Can contain special characters"            
        }
        try{
            var hash = await bcrypt.hash(password, 8);
            await AccountModel.create({username,email,password:hash})
            message = "Account has been created";
        }catch(error){
            //checking for unique constraint
            if(error.code == 11000){
                //giving a more defined response
                message = `${error.errmsg.split('"')[1]} already taken`;// will parse the duplicate value
            }else if (error.message){
                message = error.message;
            }else{
                message = `Could not register account because ${error}`;
            }
        }finally{
            return message;
        }
    
    },
    async update({key, value}, context){
        var loggedIn = await verifyTokenPredicate(context.request.headers.cookie)
        if (loggedIn){
            return "logged in can update"

        }
    }
}
var schema = makeExecutableSchema({ typeDefs, root });



var UserRouter = express.Router();

UserRouter.use("/user", function controller(request, response){
    return graphqlHTTP({
            schema,
            rootValue:root,
            graphiql:true,
            context:{request, response}
    })(request, response);
})




export default UserRouter;
