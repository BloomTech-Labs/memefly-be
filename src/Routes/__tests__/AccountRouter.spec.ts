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
    auth?:string | undefined;
}
interface IUpdateTestAccount{
    key:string;
    newValue:string;
    oldValue?:string;
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
function myAccountQuery():string{
    return `
        query{
            myAccount{
                account{
                    username
                    email
                }
                message
                status
            }
        }
    `
}
function followMutation(test:ITestAccount):string{
    let {username} = test;
    return `
        mutation{
            follow(username:"${username}"){
                message
                followed
            }
        }
    `
}
function unfollowMutation(test:ITestAccount):string{
    let {username} = test;
    return `
        mutation{
            unfollow(username:"${username}"){
                message
                unfollowed
            }
        }
    `
}

function updateMutation(update:IUpdateTestAccount):string{
    let {key, newValue, oldValue} = update;
    return `
        mutation{
            update(key:"${key}", newValue:"${newValue}", oldValue:"${oldValue}"){
                updated
                message
            }
        }
    `
}

function axioConfig(query:string, auth?:string):AxiosRequestConfig{
    return {
        url:"http://localhost:5000/account",
        method:"POST",
        headers:{
            authorization:auth? auth:""
        },
        data:{
            query
        }
    }
}
var server = spawn("node", ["./build/server.js"]);
       server.stdout.on("data", (data) => {
           console.log(`Test ${data}`);
       })


after(async () => {
    AccountModel.collection.drop();
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
                            this.auth = token;
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
       it("brings auth cookie back in the response header", async () =>{
           var token;
           let {headers:{["set-cookie"]:cookie}} = await axios({...axioConfig(log), withCredentials:true});
           for(let i of cookie){
               if(i.includes("token")){
                    let cookieArr = i.split(";");
                    token = {token:cookieArr[0].split("=")[1]};
               }else{
                   return assert("no auth cookie found.")
               }
               
           }
           expect(token).to.haveOwnProperty("token")
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
       it("successfully updates email with mutation", async () => {
            let update = testAccount();
            update.email = {type:"valid"};
            let email:any = update.email;
            let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"email", newValue:email}), state.auth));
            //update top level test email to stay up to date with current user info for later tests
            if(updated){
                test.email = email;
            }
            expect(updated).to.eql(true);
       })
       it("does not update email with Invalid mutation", async () => {
        let update = testAccount();
        update.email = {type:"invalid"};
        let email:any = update.email;
        let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"email", newValue:email}), state.auth));
  
        expect(updated).to.eql(false);
        })
        it("successfully updates username with mutation", async () => {
            let update = testAccount();
            update.username = {type:"valid"};
            let username:any = update.username;
            let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"username", newValue:username}), state.auth));
            if(updated){
                test.username = username;
            }
            expect(updated).to.eql(true);
       })
       it("does not update username with Invalid mutation", async () => {
        let update = testAccount();
        update.username = {type:"invalid", prefix:"--"};
        let username:any = update.username;
        let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"username", newValue:username}), state.auth));

        expect(updated).to.eql(false);
        })
      
        it("successfully updates password with mutation and hashes new password", async () => {
            if(state.tokenDecrypted != undefined){
                let before:any = await AccountModel.findById(state.tokenDecrypted._id)
                let update = testAccount();

                update.password = {type:"valid", length:16};
                let password:any = update.hash;
                let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"password", newValue:password, oldValue:test.hash}), state.auth));
                let after:any = await AccountModel.findById(state.tokenDecrypted._id);
                // If the hash length is greater then 32 (which is the longest length a valid password can be in the test account api) then we know its hashed
                // also check if the hash is not equal to the original hash
                let testResult = (() => {
                    if(after.hash != before.hash && after.hash.length > 32 && updated == true){
                        //update top level test password 
                        test.password = update.hash;
                        return true;
                    }else{
                        return false;
                    }
                
                })()
                expect(testResult).to.eq(true);
            }
       })
       it("does not update invalid password with mutation", async () => {
        if(state.tokenDecrypted != undefined){
            let before:any = await AccountModel.findById(state.tokenDecrypted._id)
            let update = testAccount();

            update.password = {type:"invalid"};
            let password:any = update.hash;
            let {data:{data:{update:{updated}}}} = await axios(axioConfig(updateMutation({key:"password", newValue:password, oldValue:test.hash}), state.auth));
            let after:any = await AccountModel.findById(state.tokenDecrypted._id);
        
            let testResult = (() => {
                if(after.hash != before.hash && after.hash.length > 32 && updated == true){
                    //update top level test password 
                    test.password = update.hash;
                    return true;
                }else{
                    return false;
                }
            
            })()
            expect(testResult).to.eq(false);
        }
       })
        it("brings back account details with myAccount query", async () => {
            if(state.tokenDecrypted != undefined){
                let {data:{data:{myAccount:{account:{username, email}, status}}}} = await axios(axioConfig(myAccountQuery(), state.auth));
                
                let testResult = (() => {
                    return username == test.username && email == test.email && status == true
                })()
                expect(testResult).to.eq(true);

            }
        })
        new_Account_Setup:
        {
            //setting up a new account to test follow / unfollow
            let account = testAccount();
            account.username = {type:"valid"};
            account.email = {type:"valid"};
            account.password = {type:"valid"};
            it("follows an account", async () => {
                //register new account
                await AccountModel.create(account);
                let {data:{data:{follow:{followed}}}} = await axios(axioConfig(followMutation(account), state.auth));
                expect(followed).to.eql(true);
            })
            it("unfollows that same account", async () => {
                let {data:{data:{unfollow:{unfollowed}}}} = await axios(axioConfig(unfollowMutation(account), state.auth));
                expect(unfollowed).to.eql(true);
            })
        }
       
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