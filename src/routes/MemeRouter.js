"use strict"
import {MemeDataModel} from "../models";
import express from "express";
import { importSchema } from 'graphql-import'
import { makeExecutableSchema } from 'graphql-tools';
import graphqlHTTP from "express-graphql";
var typeDefs = importSchema("./src/graphql/schema.graphql");

var root = {
    async getMemes(){
       try{
            let memes =  MemeDataModel.find()
            return memes;
       }catch{
            return []
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
var MemeRouter = express.Router();

MemeRouter.use("/memes", function controller(request, response){
    return graphqlHTTP({
            schema,
            rootValue:root,
            graphiql:false,
            context:{request, response}
    })(request, response);
})

export default MemeRouter;