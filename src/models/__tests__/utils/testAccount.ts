import * as email_addresses from "../../../data/seed_data/email.json";
import * as usernames from "../../../data/seed_data/username.json";

interface ITestAccount{
    username:string | config;
    email:string | config;
    hash?:string;
    password?:string | config; 
}
interface config{
    type:string;
    suffix?:string;
    prefix?:string;
    length?:number;
}

function generateUsername(type:string, prefix?:string, suffix?:string ):string{
    var username:string = "";
    var length = usernames.data.length;
    var base = usernames.data[Math.floor(Math.random() * length)].username;
    
    switch(type){
        case "valid":
            username = base
            
        case "invalid":
            username = (prefix || "") + base + (suffix || "");
    }
    return username
}

function genrateEmail(type:string, prefix?:string, suffix?:string ):string{
    var email:string = "";
    var length = email_addresses.data.length;
    var base = email_addresses.data[Math.floor(Math.random() * length)].email;
    
    switch(type){
        case "valid":
            email = base
            break;
        case "invalid":
            //left side of the valid email
            email = (prefix || "") + base.split("@")[0] + (suffix || "");
            break;
        
    }
    return email;
}

function generatePassword(type:string, prefix?:string, suffix?:string, length?:number ):string{
    var password:string = ""
    var special = ["!","@","#","$","%","^","&","*","(",")"];
    var count = 0;
    var ascii = [..._a_z_0_9_special()];
    switch(type){
        case "valid":
            (() => {
                let max = (length || 32);
                for(let i = 0; i <= max ; ++i){
                    password += ascii[Math.floor(Math.random() * ascii.length)];
                }   
            })() 
            break;
        case "invalid":
            password =  (prefix || "") + "password" + (suffix || "");  
    }
    
    function* _a_z_0_9_special(){
        for(let i = 97; i <= 122; ++i){
            yield count;
            yield special[count];
            yield String.fromCharCode(i);
            yield String.fromCharCode(i).toUpperCase();
            count ++;
            if (count == 10){
                count = 0;
            }
        }
    } 
    return password;
}


function testAccount(user:ITestAccount):ITestAccount{
    var handler = {
        set(obj:ITestAccount, prop:keyof ITestAccount, value:config){
            if (prop == "password"){
                delete obj.password;
                if(typeof value == "string"){
                    return Reflect.set(obj, "hash", value);
                }
                if(value.length != undefined && value.length > 32){
                    console.log(`password length is to long. the maximum it can ever be is 32`);
                    return Reflect.set(obj, "password", "");
                }
                switch(value.type){
                    //8 is the is the min for a valid length of a password 32 is the max period;
                
                    case "valid":
                        if(value.suffix != undefined || value.prefix != undefined){
                            console.log(`you cant have a type:'${value.type}' and add a prefix or suffix to password`);
                            return Reflect.set(obj, "password", "");
                        }else{
                            if(value.length != undefined && value.length < 8){
                                console.log( `password is to short to be a valid password add a length between  8 and 32`);
                                return Reflect.set(obj, "password", "");
                            }else{
                                // undefined undefined for prefix and suffix
                                return Reflect.set(obj, "hash", generatePassword("valid", undefined, undefined, value.length ));
                                
                            }
                        }
                        
                    case "invalid":
                        if(value.length != undefined){
                            console.log(`you cant have a type:'${value.type}' and give it a length`);
                            return Reflect.set(obj, "password", "");
                        }
                        return Reflect.set(obj, "hash", generatePassword("invalid", (value.prefix || ""), (value.suffix || "") ));
                    default:
                        console.log(`not a valid type:'${value.type}' for password use valid | invalid`);
                        return Reflect.set(obj, "password", "");
                }
            }else if(prop == "email"){
                if(typeof value == "string"){
                    return Reflect.set(obj, "email", value);
                }
                switch(value.type){
                    case "valid":
                        if(value.suffix != undefined || value.prefix != undefined){
                            console.log(`you cant have a type:'${value.type}' and add a prefix or suffix to email`)
                            return Reflect.set(obj, "email", obj.email);
                        }else{
                            return Reflect.set(obj, "email", genrateEmail("valid"));
                        }
                    case "invalid":
                        return Reflect.set(obj, "email", genrateEmail("invalid", (value.prefix || ""), (value.suffix || "")));
                    default:
                        console.log(`not a valid type:'${value.type}' for email use valid | invalid`);
                        return Reflect.set(obj, "email", obj.email);
                }
            
            }else if (prop == "username"){
                if(typeof value == "string"){
                    return Reflect.set(obj, "username", value);
                }
                switch(value.type){
                    case "valid":
                        if(value.suffix != undefined || value.prefix != undefined){
                            console.log(`you cant have a type:'${value.type}' and add a prefix or suffix to username`)
                            return Reflect.set(obj, "username", obj.username);
                        }else{
                            return Reflect.set(obj, "username", generateUsername("valid"));
                        }
                       
                    case "invalid":
                        return Reflect.set(obj, "username", generateUsername("invalid", (value.prefix || ""), (value.suffix || "")));
                    default:
                            console.log(`not a valid type:'${value.type}' for username use valid | invalid`);
                            return Reflect.set(obj, "email", obj.email);
            }
            }else{
                return false;
            }
        }
    }
    return new Proxy(user, handler)
}

export default testAccount