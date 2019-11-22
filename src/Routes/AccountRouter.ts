import express from "express";
import graphqlHTTP from "express-graphql";
import AccountModel from "../models/Account";
import {importSchema} from "graphql-import";
import {makeExecutableSchema} from "graphql-tools";

var typeDefs = importSchema("./src/graphql/schema.graphql");

interface IContext{
    response:express.Response;
    request:express.Request;
}

interface IAccountArgs{
    email:string;
    username:string;
    password:string;
}
interface Iregister{
    msg:String;
    created:Boolean;
}

var root = {
    async register(args:IAccountArgs, context:IContext):Promise<Iregister>{
        var message:Iregister = {msg:"", created:false};
        try {

            let {username, email, password:hash} = args;
            let account = {username, email, hash};
            
            await AccountModel.create(account);
            message = {msg:`Account has been Created`, created:true};
        }catch(error){

            message = {msg:error, created:false};
        }finally{
            return message;
        }
    }
}

var schema = makeExecutableSchema({ 
    typeDefs, 
    resolverValidationOptions: {
		requireResolversForResolveType: false,
	}, 
});

var AccountRouter = express.Router();

AccountRouter.use("/account", function controller(request, response){
    return graphqlHTTP({
        schema,
        rootValue:root,
        graphiql:true,
        context:{request,response},

    })(request, response)
})




export default AccountRouter;