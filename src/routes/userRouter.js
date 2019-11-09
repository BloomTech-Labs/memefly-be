var userRouter = require("express").Router()
var {UserModel} = require("../models")
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var {privateKey} = require("../../configVars.js");
var Yup = require("yup");

var registerSchema = 
    Yup.
        object().
            shape({
                email:Yup.string().email().required(),
                firstName:Yup.string().required(),
                lastName:Yup.string().required(),
                userName:Yup.string().required(),
                password:Yup.string().required(),
                moderator:Yup.boolean(),
                admin:Yup.boolean(),
            })

var loginSchema = (email) => {
    var fields = email
    ? {email:Yup.string().email().required()}
    : {userName:Yup.string().required()}
    fields.password = Yup.string().required();

    return Yup.object().shape(fields);
}

function registerCheck(request, response, next){
    registerSchema.
        validate(request.body). 
            then((valid) => {
                if(valid){
                    next()
                }else{
                    response.status(400).json({message:"REGISTER failed at second validation phase >> check malformed body"});
                }
            }). 
                catch(error => {
                    response.status(500).json({"error":error});
                })
}

//gives the ability to login with either email or userName
function loginCheck({body:{email, userName, password}, headers}, response, next){
    var schema, fields;
    if(password == undefined){
        response.status(400).json({message:"POST missing password >> check malformed body"});
    }
    else if(email == undefined && userName != undefined){
        schema = loginSchema(false);
        fields = {userName, password};
        headers.loginType = "userName";
    }
    else if(userName == undefined && email != undefined){
        schema = loginSchema(true);
        fields = {email, password};
        headers.loginType = "email";
    }else{
        //default to email login
        schema = loginSchema(true);
        fields = {email, password};
        headers.loginType = "email";
    }
    schema. 
        validate(fields). 
            then(valid => {
                if(valid){
                    console.log(`logging in with ${headers.loginType}`);
                    next();
                }else{
                    response.status(400).json({message:"LOGIN failed at second validation phase >> check malformed body"});
                }
            }).
                catch(() => {
                    response.status(400).json({message:"LOGIN failed at second validation phase >> check malformed body"});
                })
}

userRouter.
    route("/register"). 
        all(registerCheck).
            post((request, response) => {

                bcrypt.hash(request.body.password, 8).
                    then(hash => {
                        //create document if hash successful 
                        UserModel.
                            create({...request.body, password:hash}). 
                                then(result => {

                                    response.status(201).json({message:"Created", user:result});
                                }). 
                                    catch(error => {
                                        //check for unique constraint
                                        if(error.code == 11000){
                                            response.status(400).json({"error": "Username/email already taken"});
                                        }else{
                                            response.status(500).json({"error":error});
                                        }
                                    }) 
                    }). 
                        catch(error => {
                            response.status(500).json({"error":error});
                        })
                    
            });
userRouter.
    route("/login").
        all(loginCheck).
           post(({body:{email, userName, password}, headers}, response) => {
                var loginValue = email ? email:userName;
                //find user
                UserModel.
                    findOne({[headers.loginType]:loginValue}). 
                        then(result => {
                            console.log(result);
                            if (result == null){
                                response.status(400).json({message:`Invalid ${headers.loginType}/password`});
                            }else{
                                bcrypt.compare(password, result.password). 
                                    then(valid => {
                                        if(valid){
                                            jwt.sign({email}, privateKey, {expiresIn:"1h"}, (error, token) => {
                                                if(error){
                                                    response.status(500).json({"error":error}); 
                                                }else{
                                                    //final stop if all goes well
                                                    response.status(200).json({message:"logged in", token, userID:result._id});
                                                }   
                                            })
                                        }else{
                                            response.status(400).json({message:"Invalid email/password"});
                                        }
                                    }). 
                                        catch(error => {
                                            response.status(500).json({"error":error});                       
                                        })
                            }
                        }). 
                            catch(error => {
                                response.status(500).json({"error":error});
                            })

           })
        

module.exports = userRouter;