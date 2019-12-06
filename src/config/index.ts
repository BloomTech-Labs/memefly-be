if (process.env.NODE_ENV != "production"){
    var dotenv = require("dotenv");
    dotenv.config()
}
const env = process.env.NODE_ENV || "development";
import dev from "./development";
import prod from "./production";
interface IenvConfig {
    URI:string;
    privateKey:string;
    AWSAccess:string;
    AWSSecret:string;
}

export var envConfig:IenvConfig = 
(() => {
    switch(env){
        case "production":
            return prod;
        default:
            return dev;
        
    }
})()
