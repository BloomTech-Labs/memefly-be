if(process.env.NODE_ENV != "production"){
    var {
        parsed:{
            ACCOUNT_URI,
            privateKey,
        }
    } = require("dotenv").config()
}else{
    var ACCOUNT_URI = process.env.ACCOUNT_URI;
    var privateKey = process.env.privateKey;
}
module.exports = 
{
    ACCOUNT_URI,
    privateKey,
}