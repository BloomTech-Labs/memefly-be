import * as email_addresses from "../../../data/seed_data/email.json";

interface ITestAccount{
    username:string;
    email:string | config;
    hash?:string;
    password?:string | config; 
}
interface config{
    type:string;
}

function genrateEmail(type:string):string{
    var email:string = "";
    var length = email_addresses.data.length;
    switch(type){
        case "strong":
            email = email_addresses.data[Math.floor(Math.random() * length)].email;
            break;
        case "weak":
            //left side of the valid email
            email = email_addresses.data[Math.floor(Math.random() * length)].email.split("@")[0]; 
            break;
        
    }
    return email;
}

function generatePassword(type:string):string{
    var password:string = ""
    var special = ["!","@","#","$","%","^","&","*","(",")"];
    var count = 0;
    var ascii = [..._a_z_0_9_special()];
    switch(type){
        case "strong":
            (() => {
                for(let i = 0; i <= 32; ++i){
                    password += ascii[Math.floor(Math.random() * ascii.length)];
                }   
            })() 
            break;
        case "weak":
            password = "password";      
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
                switch(value.type){
                    case "strong":
                        return Reflect.set(obj, "hash", generatePassword("strong"));
                    case "weak":
                        return Reflect.set(obj, "hash", generatePassword("weak"));
                    default:
                        console.log(`not a valid type:'${value.type}' for password use strong | weak`);
                        return Reflect.set(obj, "password", "");
                }
            }else if(prop == "email"){
                switch(value.type){
                    case "strong":
                        return Reflect.set(obj, "email", genrateEmail("strong"));
                    case "weak":
                        return Reflect.set(obj, "email", genrateEmail("weak"));
                    default:
                        console.log(`not a valid type:'${value.type}' for email use strong | weak`);
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