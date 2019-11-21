"use strict"
import express from "express";
import graphqlHTTP from "express-graphql";
import { importSchema } from 'graphql-import'
import { makeExecutableSchema } from 'graphql-tools';
import bcrypt from "bcrypt";
import {AccountModel, DirectMessageModel ,valid, errmsg} from "../models";
import {privateKey} from "../../configVars.js";
import jwt from "jsonwebtoken";
import {parse} from "cookie";
const SALT_ROUNDS = 8;
const TYPE_DEFS = importSchema("./src/graphql/schema.graphql");

//predicate function to check if user is logged in returns boolean false || truthy id
async function loggedIn(cookie, cParse = parse){
    const  LOGGED_IN = await _verifyToken(cookie);
    return LOGGED_IN;

    function _verifyToken(cookie){
        if(cookie == undefined || typeof cookie != "string"){
            return Promise.resolve(false);
        }
        var {token, _id:userID} = cParse(cookie);

        return new Promise(function (resolve){
            if(token == undefined || userID == undefined){
                resolve(false);
            }
            jwt.verify(token, privateKey, (error, token) => {
                if(error){
                    resolve(false)
                }else if(token._id == userID) {
                    //to watch out for implicit coercion when "" == 0 aka false;
                    if(token._id.length > 0){
                        resolve(token._id);
                    }else{
                        resolve(false);
                    }      
                }else{
                    resolve(false);
                }
            })
                
        })
    }
}
function parseMongooseError(error){
    
    //in the case of user defined error messages;
    if(typeof error == "string"){
        return error
    }
    if (error.status) return error;
    //for unique constraint
    if(error.code == 11000) return `${error.errmsg.split('"')[1]} already taken`;
   
    else{
        //defaults to returning standard Error 
        return `${JSON.stringify(error)}`;
    }
}
function cookieFromContext(context){
    var {request:{headers:{cookie}}} = context;
    return cookie;
}
const RESOLVERS = {
    async login(args, context){
        //TODO check cookie and see if aready Logged in 
        var message;
        try{
            let {username, email, password} = args, loginKey, loginValue
            //checkstop, user can log in with either email or username;
            if(username != undefined && email == undefined) loginKey = "username";
            if(username == undefined && email != undefined) loginKey = "email";
            if(username != undefined && email != undefined) loginKey = "email";//default to email if they are both in body
            if(username == undefined && email == undefined) throw "Malformed Query need either email/username";

            loginValue  = (loginKey == "email") ? email : username;
            let searchFilter = {[loginKey]:loginValue}

            const ACCOUNT  = await AccountModel.findOne(searchFilter);
 
            if(ACCOUNT != null){
                let pMatches = await bcrypt.compare(password, ACCOUNT.password);
                if(pMatches){
                    let token = await jwt.sign({_id:ACCOUNT._id, username:ACCOUNT.username}, privateKey, {expiresIn:"1h"});
                    if(token){
                        let options = 
                        {
                            expires:new Date.now() + 900000,
                        }
                        await context.response.cookie("token", token, options ); 
                        await context.response.cookie("_id", `${ACCOUNT._id}`, options);
                        
                        message = ACCOUNT.username;
                    }
                }else{
                    throw "Invalid Credentials "
                }
            }else{
                throw "Invalid Credentials "
            }

        }catch(error){    
            message =  parseMongooseError(error);
        }finally{
            return message;
        }          
    },

    async register(args){
        var message;
        try{
            let {username, email, password} = args;
            if(!valid("password", password)){
                throw errmsg("password");
            }
            let hash = await bcrypt.hash(password, SALT_ROUNDS);
            const USER = 
            {
                username,
                email,
                password:hash
            };

            await AccountModel.create(USER);
           
            message = "Account has been created";
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }
    
    },


    async update(args, context){
        var message;
        try{
            let {key, value, oldValue} = args;
            let cookie = cookieFromContext(context);

            if(_cantUpdate(key)) throw `${key} is not allowed to be updated`;

            const UID  = await loggedIn(cookie);

            if (UID){

                const USER = await AccountModel.findById(UID);

                if(USER == undefined) throw "Please Log in";
                //check if the user already has the new value
                //values are lowecased on register so need to lowercase them here
                if(USER[key] == value.toLowerCase()) throw `your ${key} is already ${value}`;

                let update = {};
                switch(key){
                    case "password":
                        if(value == oldValue) throw "old password is the same as new password";
                        if(oldValue == undefined) throw "Updating password requires you to add a oldValue:value key/pair";
                        if(!valid("password", value)) throw errmsg("password");
                        else{
                            let pMatches = await bcrypt.compare(oldValue, USER.password);
                                if (pMatches){
                                    // hash new password
                                    update.password = await bcrypt.hash(value, SALT_ROUNDS);
                                }else{
                            
                                    throw "Old password is invalid";
                                }      
                        }
                        break;
                        //eveything else can be updated normally
                    default:
                        if(!valid(key, value)) throw errmsg(key, value);
                        else{
                            update[key] = value;
                        }
                        break;
                }
                let updated = await AccountModel.updateOne(USER, update);
                if(updated.nModified){
                    message = `Successfully updated ${key}`;
                }else{
                    throw `${key} was not updated`;
                }  
                
    
            }else{
                throw "Please Login."
            }
            
            
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }
        //negated predicate function if user cant update a key
        function _cantUpdate(key){
            var allowed = ["password", "email", "username"];
            return !allowed.includes(key);
        }  
    },

    async myAccount(_, context){
        var message = {
            status:"OK"
        }
        try {
            let cookie = cookieFromContext(context);
            const UID  = await loggedIn(cookie);
            if(UID){
                const USER = await AccountModel.findById(UID);
                //toObject is called because if not message will be assigned USER's prototype
                Object.assign(message, USER.toObject());
            }else{
                throw {
                    status:"Please Login",
                    username:null,
                    email:null,
                }
            }
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }
       
    },

    async searchUser(args){
        var message = [];
        try{
            let {username:search} = args;
            let filter = {username:new RegExp(search)};
            const SEARCH_RESULT =  await AccountModel.find(filter).limit(300);

            message = 
            SEARCH_RESULT.map(user => { 
                return {
                    followers:user.followers.length,
                    following:user.following.length,
                    username:user.username,
                }
            });
        }catch{
            //if any errors are thrown via mongoose
            return [];
        }finally{
            return message
        }   
    },

    async follow(args, context){
        var message;
        // top level destructure because used in catch
        var {username} = args;
        
        try{

            let cookie = cookieFromContext(context);
            const UID  = await loggedIn(cookie);

            if(UID){
                    
                const CURRENT_USER = await AccountModel.findById(UID);
                let filter = {username};
                const USER_TO_FOLLOW = await AccountModel.findOne(filter);
                if(CURRENT_USER == undefined){

                    throw "you are not logged in";
                
                }else if(USER_TO_FOLLOW == undefined){

                    throw `user ${username} does not exist`;

                }else if(USER_TO_FOLLOW.username == CURRENT_USER.username){

                    throw "You cant follow yourself";

                }else if(USER_TO_FOLLOW.followers.includes(CURRENT_USER._id) ){

                    throw `You are already following ${USER_TO_FOLLOW.username}`;

                }else{
                        //add to USER_TO_FOLLOW'S follower array 
                        let followed = await AccountModel.updateOne(USER_TO_FOLLOW, {$push:{followers:{_id:CURRENT_USER._id}}});
                        //add to CURRENT_USER follower array
                        let following = await AccountModel.updateOne(CURRENT_USER, {$push:{following:{_id:USER_TO_FOLLOW._id}}});

                        if(followed.nModified && following.nModified){
                            message = `you have followed ${USER_TO_FOLLOW.username}`;
                        }
                }
            }else{
                throw "Please Log In."
            }
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }
    },
    async unfollow(args, context){
        var message;
        // top level destructure because used in catch
        var {username} = args;
        try{
            let cookie = cookieFromContext(context);
            const UID  = await loggedIn(cookie);
            if(UID){
                const CURRENT_USER = await AccountModel.findById(UID);
                let filter = {username};
                const USER_TO_UNFOLLOW = await AccountModel.findOne(filter);
                if(CURRENT_USER == undefined){

                    throw "you are not logged in.";

                }else if(USER_TO_UNFOLLOW == undefined){

                    throw `user ${username} does not exist`;

                }else if(CURRENT_USER.username == USER_TO_UNFOLLOW.username){

                    throw "You cant unfollow yourself";

                }else if(!USER_TO_UNFOLLOW.followers.includes(CURRENT_USER._id) ){

                    throw `You are not following ${USER_TO_UNFOLLOW.username}`;

                }else{
                     //remove USER_TO_UNFOLLOW from  CURRENT_USER following
                     let unfollowing = await AccountModel.updateOne(CURRENT_USER, {$pullAll:{following:[USER_TO_UNFOLLOW._id]}}, {new:true});
                   
                     //remove CURRENT_USER from USER_TO_UNFOLLOW following
                     let unfollowed = await AccountModel.updateOne(USER_TO_UNFOLLOW, {$pullAll:{followers:[CURRENT_USER._id]}}, {new:true});

                     if(unfollowed.nModified && unfollowing.nModified){
                         message =  `you have unfollowed ${USER_TO_UNFOLLOW.username}`;
                     }
                }
            }else{
                throw "Please Log In.";
            }
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }

      

    },
    async createDMRoom({username}, context){
        var message;
        try {

            let cookie = cookieFromContext(context);
            const UID = await loggedIn(cookie);
            if(UID){
                const CURRENT_USER = await AccountModel.findById(UID);
                let filter = {username};
                const USER_TO_DM = await AccountModel.findOne(filter);
                
                if(USER_TO_DM == undefined){
                    
                    throw {status:404, roomID:`user ${username} does not exist.`};

                }else{
                    //check if room exists between both users
                    let room = await DirectMessageModel.findOne({$and:[{"user_pool": CURRENT_USER},{"user_pool": USER_TO_DM}]}); 

                    if (room == undefined){
                        //create room between both users 
                         room = await DirectMessageModel.create({
                            user_pool:[{_id:CURRENT_USER._id}, {_id:USER_TO_DM._id}]
                        })
                        //add room id to along with username to each user  rooms array
                        var cRoomed = await AccountModel.update(CURRENT_USER, {$push:{rooms:{roomID:room._id, user:USER_TO_DM.username }}});
                        
                        var uRoomed = await AccountModel.update(USER_TO_DM, {$push:{rooms:{roomID:room._id, user:CURRENT_USER.username }}});

                        if(cRoomed.nModified && uRoomed.nModified){
                            message = {status:201, roomID:room._id};
                        }else{
                            throw  {status:201, roomID:"ERROR Could not connect"};
                        }
                        
                    }else{
                        message = {status:200, roomID:room._id, messages:room.messages};
                    }
                }
            }else{
                throw {status:404, roomID:"Please Login"};
            }
        }catch(error){
          
            message = parseMongooseError(error);
        }finally{
            return message;
        }
       
        
    },

    async getRooms(_, context){
        var message;
        try{
            
            let cookie = cookieFromContext(context);
            const UID = await loggedIn(cookie);
            if(UID){
                const USER = await AccountModel.findById(UID);
                message = USER.rooms;
            }else{
                throw "Please Log In.";
            }
        }catch(error){
            message = parseMongooseError(error);
        }finally{
            return message;
        }
    }
}
var schema = makeExecutableSchema({ 
    typeDefs:TYPE_DEFS, 
    root:RESOLVERS,
    resolverValidationOptions: {
		requireResolversForResolveType: false,
	}, 
});
var UserRouter = express.Router();

UserRouter.use("/user", function controller(request, response){
    return graphqlHTTP({
            schema,
            rootValue:RESOLVERS,
            graphiql:true,
            context:{request, response}
    })(request, response);
})

export default UserRouter;
