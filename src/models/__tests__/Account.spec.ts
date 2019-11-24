import { expect, assert } from "chai";
import AccountModel from "../Account";
import testAccount from "./utils/testAccount";
import "mocha";

after(async () => {
    AccountModel.collection.drop();
})

describe("Valid Account Creation", () => {
    var _id:string;
    var test = testAccount();
    test.email = {type:"valid"};
    test.username = {type:"valid"};
    test.password = {type:"valid"};
    //hash is part of the excepted AccountModel's Schema, so I am just storing password to a top level variable to not confuse the reader
    var password:string = (test.hash as string);
    console.log("running test on ", test);
    it("successfully gets created", async () => {
        let account = await AccountModel.create(test);
        expect(account.toObject()).to.have.own.property("_id");
        _id = account._id
    });
    it("hashes password before creation", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
             //if the hash length is greater then 32 that means its longer then the valid password from the testAccount proxy
            expect(account.toObject()).to.have.own.property("hash").and.length.to.be.gt(32);
        }else{
            assert.fail();
        }
    });
    it("successfully compares with valid password", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
           let compare = await account.compareHash(password);
           expect(compare).to.equal(true);
       }else{
           assert.fail();
       }
    });
    it("successfully compares with invalid password", async () => {
        let account = await AccountModel.findById(_id);
        if(account){
           let compare = await account.compareHash(password + "_");
           expect(compare).to.equal(false);
       }else{
           assert.fail();
       }
    })       
})

describe("Invalid Account Creation", () => {
    var test = testAccount();
    console.log(test);
})