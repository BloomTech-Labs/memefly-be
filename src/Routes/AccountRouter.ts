import express from "express";
import graphqlHTTP from "express-graphql";
import AccountModel from "../models/Account";
import {importSchema} from "graphql-import";
import {makeExecutableSchema} from "graphql-tools";
import {envConfig} from "../config"
import jwt from "jsonwebtoken";

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
interface ILoginArgs{
    getLogin():any
    email?:string;
    username?:string;
    password:string;
}

interface Imessage{
    token?:string;
    message?:string;
    created?:boolean;
    loggedIn?:boolean;
    status?:boolean;
  
}
interface  loginConfig{
    [key: string]:any
    [Symbol.iterator]:any
}
var root = {
    async register(args:IAccountArgs):Promise<Imessage>{
        var message:Imessage = {};
        try {
            let {username, email, password:hash} = args;
            let account = {username, email, hash};   
            await AccountModel.create(account);
            message = {message:`Account has been Created`, created:true};
        }catch(error){
            message = {message:error, created:false};
        }finally{
            return message;
        }
    },
    async login(args:ILoginArgs, context:IContext):Promise<Imessage>{
        var message:Imessage = {};        
        try{
            //user can log in with either username or email
            let _config:loginConfig = {
                *[Symbol.iterator](){
                     yield this.email;
                     yield this.username;
                 },
                getLogin(){
                    //iterate through email and username and return its [key]:value based on what is not undefined and not and empty string
                    for(let value of this){
                         if (value != undefined && value.trim().length > 0){
                           let key = Object.keys(this).find(key => this[key] == value);
                           return {[key as string]:value, password:this.password, type:key};
                         }
                    }
                    //if they are both undefined
                    return undefined;
                  }
               }
            Object.assign(args, _config)        
            // Example: {email:"example@example.com", password:"Password1234", type:"email"}
            let $ = args.getLogin()
            
            if($ != undefined){
                let account = await AccountModel.findOne({[$.type] : $[$.type]})
                if(account != undefined){
                    let valid = account.compareHash($.password);
                    if(valid){
                        let token = await sign({_id:account._id});
                        if(token){  
                            context.response.cookie("token", token);
                            message = {token, loggedIn:true};
                        }else{
                            throw "Error logging in."
                        }
                    }else{
                        throw `Invalid ${$.type}/password`;
                    }
                }else{
                    throw `Invalid ${$.type}/password`;
                }
                
            }else{
                throw "Malformed body needs either email/username";
            }
        }catch(error){
            message = {message:error, loggedIn:false};
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

function sign(payload:object):Promise<string | undefined>{
    return new Promise((resove, reject) => {
        jwt.sign(payload, envConfig.private_key, {expiresIn:"2h"}, (error, token) => {
            if(error){
                reject(error);
            }else{
                resove(token);
            }
        });
    })
}


export default AccountRouter;