"use strict"
import mongoose from "mongoose";
import {ACCOUNT_URI} from "../../configVars.js";

var AccountSchema = 
    mongoose.Schema({
        email:{
            type:String,
            required:true,
            lowercase:true,
            validate:{
                validator: (value) => {
                    return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g.test(value)
                },
                message: (props) => {
                    return `${props.value} is not a valid email address.`
                }
            },
            unique:[true,"email address already in use"],
        },
        username:{
            type:String,
            min:[3, "username must be at least 3 characters long."],
            max:[29, "username cannot exceed, 29 characters."],
            required:true,
            validate:{
                validator: (value) => {
                    return  /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{2,29}$/igm.test(value);
                },
                message: (props) => {
                    return `${props.value} is not a valid username`
                }
            },
            lowercase:true,
            unique:[true, "username taken."],
        },
        password:{
            type:String,
            min:8,
            required:true,
            validate:{
               validator: (value) => {
                    return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm.test(value);
                },
                message: () => {
                    return "password must be at least 8 characters long, must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number Can contain special characters";
                }
            },
            last_updated:{type:Date, default:Date.now}
        },
        created:{
            type:Date,
            default:Date.now
        },
        followers:[{type:mongoose.Schema.ObjectId, ref:"Account"}],
        following:[{type:mongoose.Schema.ObjectId, ref:"Account"}]      
    })

var DirectMessageSchema = 
    mongoose.Schema({
        created:{type:Date, default:Date.now},
        user_pool:[{type:mongoose.Schema.ObjectId, ref:"Account", required:true}],
        messages:[{}]
        

    })
var connectionOptions =
{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}
var accountConn = mongoose.createConnection(ACCOUNT_URI, connectionOptions);
var dmConn = mongoose.createConnection(ACCOUNT_URI, connectionOptions);
// need to export the validator from the schema because i need to validate password before hashing
export var validate = (key, value) => {
    return AccountSchema.tree[key].validate.validator(value);
}; 
export var errmsg = (key, value) => {
    return AccountSchema.tree[key].validate.message({value});
};
export var AccountModel = accountConn.model("Account", AccountSchema);
export var DirectMessageModel = dmConn.model("Direct_Message", DirectMessageSchema);

