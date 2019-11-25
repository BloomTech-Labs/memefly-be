import { expect, assert } from "chai";
import AccountModel from "../Account";
import testAccount, {ITestAccount} from "./utils/testAccount";
import "mocha";

after(async () => {
    AccountModel.collection.drop();
})

describe("Valid Account", () => {
    var _id:string;
    var test = testAccount();
    test.email = {type:"valid"};
    test.username = {type:"valid"};
    test.password = {type:"valid"};
    //hash is part of the excepted AccountModel's Schema, so I am just storing password to a top level variable to not confuse the reader
    var password:string = (test.hash as string);
    console.log("running \"Valid Account Creation\" test on Account", test);
    it("successfully gets created", async () => {
        let account = await AccountModel.create(test);
        expect(account.toObject()).to.have.own.property("_id");
        _id = account._id
    });
    it("hashes password before creation", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
             //if the hash length is greater then 32 that means its longer then the valid password from the testAccount proxy
             //bcrypt hashing algorithm generates a string greater then 32
            expect(account.toObject()).to.have.own.property("hash").and.length.to.be.gt(32);
        }else{
            assert.fail();
        }
    });
    it("successfully compares hash with valid password", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
           let compare = account.compareHash(password);
           expect(compare).to.equal(true);
       }else{
           assert.fail();
       }
    });
    it("successfully compares hash with invalid password", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
           let compare = await account.compareHash(password + "_");
           expect(compare).to.equal(false);
       }else{
           assert.fail();
       }
    })
    it("successfully updates password")
})

describe("Invalid Account\n", () => {
    function logCurrent(test:ITestAccount, it:string):string{     
        console.log(`running \"${it}\" on Account`, test);
        return it;
    }

    Invalid_Email:
    {
        let test = testAccount(); 
        test.username = {type:"valid"}; 
        test.email = {type:"invalid"};
        test.password = {type:"valid"};
        it(logCurrent(test, "did not create Account with invalid email"), async () => {
            var message:string | undefined;
            try{
                await AccountModel.create(test);
            }catch(error){
                message = error.message;
               
            }finally{
                console.log("TESTING: ", test.email);
                expect(message).to.not.equal(undefined);
            }
        
        })
    };
    Invalid_Username_With_Prefix:
    {
        let test = testAccount(); 
        test.username = {type:"invalid", prefix:"-"}; 
        test.email = {type:"valid"}
        test.password = {type:"valid"};
        it(logCurrent(test, "did not create Account with Invalid username that begins with a -"), async () => {
            var message:string | undefined;
            try{
                await AccountModel.create(test);
            }catch(error){
                message = error.message;
               
            }finally{
                console.log("TESTING: ",test.username);
                expect(message).to.not.equal(undefined);
            }
        
        })
    };
    Invalid_Username_With_Postfix:
    {
        let test = testAccount(); 
        test.username = {type:"invalid", postfix:"-"}; 
        test.email = {type:"valid"}
        test.password = {type:"valid"};
        it(logCurrent(test, "did not create Account with Invalid email that end with a -"), async () => {
            var message:string | undefined;
            try{
                await AccountModel.create(test);
            }catch(error){
                message = error.message;
               
            }finally{
                console.log("TESTING: ",test.username);
                expect(message).to.not.equal(undefined);
            }
        
        })
    };
    Invalid_Username_With_Custom:
    {
        let test = testAccount(); 
        test.username = " user-_-memes ";
        test.email = {type:"valid"}
        test.password = {type:"valid"};
        it(logCurrent(test, "did not create Account with custom username"), async () => {
            var message:string | undefined;
            try{
                await AccountModel.create(test);
            }catch(error){
                message = error.message;
               
            }finally{
                console.log("TESTING: ",test.username);
                expect(message).to.not.equal(undefined);
            }
        
        })
    };
    Invalid_Password:
    {
        let test = testAccount(); 
        test.username = {type:"valid"}; 
        test.email = {type:"valid"};
        test.password = {type:"invalid", postfix:"12345"};
        it(logCurrent(test, "did not create Account with invalid password"), async () => {
            var message:string | undefined;
            try{
                await AccountModel.create(test);
            }catch(error){
                message = error.message;
               
            }finally{                       //aka hash
                console.log("TESTING: ",test.hash);
                expect(message).to.not.equal(undefined);
            }
        
        })
    };

    
    

})