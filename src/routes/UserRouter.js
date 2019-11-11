"use strict"
import express from "express";
import graphqlHTTP from "express-graphql";
import {buildSchema} from "graphql";;
import { importSchema } from 'graphql-import'
import { makeExecutableSchema } from 'graphql-tools';
import AccountModel from "../models";
var typeDefs = importSchema("./src/graphql/schema.graphql");

var root = {
    hello:() => {
        return "Hello";
    },
    async register({username, email, password}){
        var message;
        try{
            var result  = await AccountModel.create({username,email,password})
            message = "Account has been created";
        }catch(error){
            //checking for unique constraint
            if(error.code == 11000){
                //giving a more defined response
                message = `${error.errmsg.split('"')[1]} already taken`;// will parse the duplicate value
            }else if (error.message){
                message = error.message;
            }else{
                message = "Could not register account"
            }
        }
        
        
        return message;
    }
}
var schema = makeExecutableSchema({ typeDefs, root });


var UserRouter = express.Router();
UserRouter.use("/user/graphql", function controller(request, response){
    return graphqlHTTP({
            schema,
            rootValue:root,
            graphiql:true,
            context:{request, response}
    })(request, response);
})




export default UserRouter;
