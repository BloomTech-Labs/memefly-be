const env = process.env.NODE_ENV || "development";
import dev from "./development";
interface IenvConfig {
    mongodb_URI:string;
    private_key:string;
}
export var envConfig:IenvConfig;
switch(env){
    case "development":
        envConfig = dev;
        break;
}
