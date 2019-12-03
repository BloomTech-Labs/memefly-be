const env = process.env.NODE_ENV || "development";
import dev from "./development";
import prod from "./production";
interface IenvConfig {
    accountURI:string;
    privateKey:string;
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
