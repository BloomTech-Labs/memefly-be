var config = require("dotenv").config()
try{
    var uri = config.parsed.userURI 
}catch(error){
    var uri = process.env.userURI;
}

var mongoose = require("mongoose");
var options = 
{
    useCreateIndex:true,
    useUnifiedTopology:true,
    useNewUrlParser:true,
}
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    email:{type:String, required:true, unique:true},
    firstName:{type:String, required:true},
    lastName:{type:String, required:true},
    userName:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    created:{type:Date, default:Date.now},
})
var userConn = mongoose.createConnection(uri, options)

var UserModel = userConn.model("users", UserSchema);

module.exports = 
{
    UserModel
}