import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {envConfig} from "../config";
var {mongodb_URI}  = envConfig;

const SALT_ROUNDS = 10;

var AccountSchema = new mongoose.Schema({
    email:{type:String, required:true, unique:true},
    username:{type:String, required:true, unique:true},
    hash:{type:String, required:true},
    created:{type:Date, default:Date.now}
})

interface IAccount extends mongoose.Document{
    email:string;
    username:string;
    hash:string;
    created:Date;
}
interface IAccountModel extends IAccount, mongoose.Document{
    compareHash(plain:string):boolean;
}


AccountSchema.pre<IAccount>("save", async function(next){
    if(this.isModified("hash")){
        this.hash = await bcrypt.hash(this.hash, SALT_ROUNDS);
        next();
    }else{
        next();
    }
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
var conn = mongoose.createConnection(mongodb_URI, options);

var AccountModel =  conn.model<IAccountModel>("Account", AccountSchema);

export default AccountModel;


