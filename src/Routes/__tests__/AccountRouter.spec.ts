import testAccount, { ITestAccount } from "../../models/__tests__/utils/testAccount";
import {expect, assert} from "chai";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import axios, { AxiosRequestConfig } from "axios";
import "mocha";
import {spawn} from "child_process";
import AccountModel from "../../models/Account";
import dotenv from "dotenv";



var envConfig:any = dotenv.config().parsed;

interface token{
    _id:string;
}
interface ITestState {
    tokenDecrypted:null | token;
}


function regMutation(test:ITestAccount):string{
    let {username, email, hash } = test;
    return  `
    mutation{
        register(username:"${username}", email:"${email}", password:"${hash}"){
            created
        }
    }
`
}
function logQuery(test:ITestAccount):string{
    let {username, hash } = test;
    return `
    query{
        login(username:"${username}", password:"${hash}"){
            token
            loggedIn
        }
    }
`;
}

function axioConfig(query:string):AxiosRequestConfig{
    return {
        url:"http://localhost:5000/account",
        method:"POST",
        data:{
            query
        }
    }
}
var server = spawn("node", ["./build/server.js"]);
       server.stdout.on("data", (data) => {
           console.log(`Test ${String(data)}`);
       })

describe("Account Router", () => {

    Valid_Register:
    {
        let state:ITestState = {
            tokenDecrypted:null,
        }
        let test = testAccount();
        test.username = {type:"valid"};
        test.email = {type:"valid"};
        test.password = {type:"valid"};
        let reg = regMutation(test);
        let log = logQuery(test);

        function register():Promise<boolean>{
            return new Promise((resolve) => {
                axios(axioConfig(reg)).then((result) =>{ 
                    let {data:{data:{register:{created}}}} = result;
                    resolve(created);
                    
                }).catch(() => resolve(false));
            })
        }
       
        function login(this:any):Promise<boolean>{
            return new Promise((resolve) => {
                axios(axioConfig(log)).then(result => {
                    let {data:{data:{login:{loggedIn, token}}}} = result;
                    jwt.verify(token, envConfig.PRIVATE_KEY, (error: JsonWebTokenError, decoded: any) => {
                        if(error){
                            resolve(false)
                        }else{
                            this.tokenDecrypted = decoded;
                            resolve(loggedIn);
                        }
       
                    });
                    
                }).catch(() => resolve(false));
            })
        }
        it("creates a Valid account with register mutation", async () => {
            let created = await register();
            expect(created).to.eql(true); 
       })
       it("does not re-create same account", async () => {
            let created = await register();
            expect(created).to.eql(false); 
       })
       it("successfully logs in with username and password", async () => {
            let loggedIn = await login.call(state);
            expect(loggedIn).to.eql(true);
       })
       it("decoded token _id == logged in account _id", async () => {
           if(state.tokenDecrypted != undefined){
                let account = await AccountModel.findById(state.tokenDecrypted._id);
                if(account != undefined){
                    expect((account._id == state.tokenDecrypted._id)).to.eql(true);
                }else{
                    assert("account not found with provided token");
                } 
           }else{
                assert("token null");
           }
           

       })
    };
    Invalid_Register:
    {
       it("does not create an account with invalid username email or password mutation", () => {
                // creates an account three times, each iteration will have ONLY one invalid field
            let fields = ["email", "username", "password"];
            function* testAccounts(){
                let testArr:any = [];
                
                for(let i = 0; i < 3; i++){
                    let label:string = fields[i];
                    let test:any = testAccount();
                    for(let field of fields){
                        if(i == fields.indexOf(field)){
                            if(field == "username"){
                                test[field] = {type:"invalid", prefix:"-"};
                            }else{
                                test[field] = {type:"invalid"};
                            }           
                        }else{
                            test[field] = {type:"valid"};
                        }
                    }
                    let created =  yield (async (test) => {
                            
                        let reg = regMutation(test);
                        let result = await axios(axioConfig(reg));
                        let {data:{data:{register:{created}}}} = result;
                        return {created, label};
                    })(test)
                    testArr.push(created);
                }
                return testArr;
            }
            async function run(){
                let resultArr = [];
                for await (let accounts of testAccounts()){
                    // console.log(`<Invalid ${accounts.label}>>> created ? >>>`, accounts.created);
                    resultArr.push(accounts.created);
                }
                expect(resultArr).to.not.include(true)
            }
            run()
        })
    }

})