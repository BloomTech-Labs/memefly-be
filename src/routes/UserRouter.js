"use strict"
import express from "express";
import graphqlHTTP from "express-graphql";
import { importSchema } from 'graphql-import'
import { makeExecutableSchema } from 'graphql-tools';
import bcrypt from "bcrypt";
import {AccountModel, validate, errmsg} from "../models";
import {privateKey} from "../../configVars.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";
var typeDefs = importSchema("./src/graphql/schema.graphql");

function verifyToken(_cookie){
    if(_cookie == undefined){
        return Promise.resolve({now:false});
    }
    var {token, _id} = cookie.parse(_cookie)
    return new Promise(function (resolve){
        if(token == undefined || _id == undefined){
            resolve({now:false});
        }
        jwt.verify(token, privateKey, (error, token) => {
            if(error){
                resolve({now:false, _id})
            }else{
                resolve({now:(token._id == _id), _id });
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
        if(!validate("password", password)){
            return errmsg("password")       
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
    async update({key, value, oldValue}, context){
        var allowedUpdates = ["password", "email", "username"];
        if(!allowedUpdates.includes(key)){
            return "That key is not allowed to be updated";
        }
        var loggedIn = await verifyToken(context.request.headers.cookie)
        if (loggedIn.now){
            const USER = await AccountModel.findById(loggedIn._id);

            if(USER == undefined){
                return "Please Log in";
                //check if the user already has the new value
            }
            if(USER[key] == value.toLowerCase()){
                return `your ${key} is already ${value}`;
            }
            var updateObject;
        
            switch(key){
                case "password":
                    if(value == oldValue){
                        return "old password is the same as new password";
                    }else if(oldValue == undefined){
                        return "Updating password requires you to add a oldValue:value key/pair"
                    }else if(!validate(key, value)){
                        return  errmsg(key, value);               
                    }else{    
                        // need to verify if old password is correct
                        let valid = await bcrypt.compare(oldValue, USER.password)
                            if (valid){
                                // now you need to hash new password
                                let hash = await bcrypt.hash(value, 8)
                                updateObject = {password:hash}   
                            }else{
                                return "Old password is invalid"
                            }      
                    }
                    //eveything else can be updated normally after being verified
                default:
                    if(!validate(key, value)){
                        return errmsg(key, value);
                    }else{
                         //construct dynamic object 
                        updateObject = {[key]:value}
                    }
            }
            try{
                var update = await AccountModel.updateOne({_id:loggedIn._id}, updateObject);
                if(update.nModified){
                    return `Successfully updated ${key}`;
                }else{
                    return `${key} was not updated`
                }  
            }catch(error){
                //checking for unique constraint
                 if(error.code == 11000){
                //giving a more defined response
                    return `${error.errmsg.split('"')[1]} already taken`;
                }else{ 
                    return `Error updating ${key}`
                }
            }

        }else{
            return "Please Login."
        }
    },
    async myAccount(_, context){
        var loggedIn = await verifyToken(context.request.headers.cookie)
        if(loggedIn.now){
            const USER = await AccountModel.findById(loggedIn._id);
            return USER;
        }else{
            return "Please Login"
        }
    },
    async searchUser({username}){
        try{
            return await AccountModel.find({username:new RegExp(username)}).limit(20);
        }catch{
            return [];
        }
        
    }

}
var schema = makeExecutableSchema({ 
    typeDefs, 
    root,
    resolverValidationOptions: {
		requireResolversForResolveType: false,
	}, 
});
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
