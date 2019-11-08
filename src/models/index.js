var {parsed:{userURI}} = require("dotenv").config()

const URI = userURI || process.env.userURI;
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
var userConn = mongoose.createConnection(URI, options)

var UserModel = userConn.model("users", UserSchema);

module.exports = 
{
    UserModel
}