interface ITestAccount{
    username:string;
    email:string;
    hash?:string;
    password?:string | password; 
}
interface password{
    type:string;
}


// I want a function that returns an new test_account proxy
/*
{                                    {
  email:"test@test.com",              email:"test@test.com",     
  userame:"test",           >>>>>>    username:"test",
  password:"test",                    hash:"test",      
}                                    {
*/
function generatePassword(type:string):string{
    var special = ["!","@","#","$","%","^","&","*","(",")"];
    var count = 0;
    var ascii = [..._a_z_0_9_special()];
    switch(type){
        case "strong":
            return (() => {
                let password:string = "";
                for(let i = 0; i <= 32; ++i){
                    password += ascii[Math.floor(Math.random() * ascii.length)];
                }
                return password;
            })() 
        case "weak":
            return "password";      
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
    return String(ascii)
}


function testAccount(user:ITestAccount):ITestAccount{
    var handler = {
        set(obj:ITestAccount, prop:keyof ITestAccount, value:password){
            if (prop == "password"){
                delete obj.password;
                switch(value.type){
                    case "strong":
                        return Reflect.set(obj, "hash", generatePassword("strong"));
                    case "weak":
                        return Reflect.set(obj, "hash", generatePassword("weak"));
                    default:
                        return Reflect.set(obj, "hash", generatePassword("weak"));
                }
                return false
            }else{
                return false;
            }
        }
    }
    return new Proxy(user, handler)
}

export default testAccount