import { expect } from "chai";
import AccountModel from "../Account";
import testAccount from "./utils/testAccount";
import "mocha";

var test = testAccount({ username:"", email:"", password:"" })

console.log(test);


// describe("Account Creation", () => {
//     it("should hash password before creation", async () => {
//         try{
//             await AccountModel.create({})
//         } 
//     })
// })