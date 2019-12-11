import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import {envConfig} from "../config";



var {URI}  = envConfig;

const SALT_ROUNDS = 10;

var AccountSchema:Schema = new mongoose.Schema({
    email:{
        type:String, 
        lowercase:true,
        required:true, 
        unique:true,
        validate:{
            validator(value:string):boolean{
                return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g.test(value)
            },
            message:"Invalid email address"
        }
    },
    username:{
        type:String, 
        lowercase:true,
        required:true, 
        unique:true,
        validate:{
            validator(value:string):boolean{
               return /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{2,29}$/igm.test(value);
            },
            message:"Invalid username"
        }
    },
    hash:{
        type:String,
        required:true,
        validate:{
            validator(value:string):boolean{
                return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm.test(value);
            },
            message:"Password must be at least 8 characters long, must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number Can contain special characters"           
        },
    },
    memes:[{ key: {type:String} }],
    followers:[{type:Schema.Types.ObjectId, ref:"Account"}],
    following:[{type:Schema.Types.ObjectId, ref:"Account"}],
    created:{type:Date, default:Date.now}
})
interface update{
    hash:string;
}
interface IAccount extends Document{
    _update:update;
    followers:IAccount["_id"];
    following:IAccount["_id"];
    email:string;
    username:string;
    hash:string;
    created:Date;
    memes:[{key:string}]

    
}
interface IAccountModel extends IAccount, Document{
    compareHash(plain:string):boolean;
    
}


AccountSchema.pre<IAccount>("save",function(next){
    if(this.isModified("hash")){
        this.validate(async (error) => {
            if(!error){
                this.hash = await bcrypt.hash(this.hash, SALT_ROUNDS);
                next();
            }
        })    
    }else{
        next();
    }
});

AccountSchema.pre<IAccount>("updateOne", async function(next){
    
    if(this._update.hasOwnProperty("hash")){
        
        //validate password trying to update
        if(this.schema.obj.hash.validate.validator(this._update.hash)){
            this._update.hash = await bcrypt.hash(this._update.hash, SALT_ROUNDS);
            next();
        }else{
            throw Error(this.schema.obj.hash.validate.message);
        }
       
    }
    next()
})

var options =
{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}

AccountSchema.methods.compareHash =  async function(plain:string):Promise<boolean>{
    return await bcrypt.compare(plain, this.hash);
}
var conn = mongoose.createConnection(URI, options);

var AccountModel =  conn.model<IAccountModel>("Account", AccountSchema);

export default AccountModel;


