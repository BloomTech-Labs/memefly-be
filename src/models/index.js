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
    //TODO update Schema
})
var userConn = mongoose.createConnection(uri, options)

var UserModel = userConn.model("users", UserSchema);

module.exports = 
{
    UserModel
}