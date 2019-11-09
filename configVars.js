if(process.env.NODE_ENV != "production"){
    var {
        parsed:{
            userURI,
            privateKey,
        }
    } = require("dotenv").config()
}else{
    var userURI = process.env.userURI;
    var userURI = process.env.privateKey;
}
module.exports = 
{
    userURI,
    privateKey,
}