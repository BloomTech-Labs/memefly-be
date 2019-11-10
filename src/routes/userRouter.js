var userRouter = require("express").Router()
var {UserModel} = require("../models")
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var {privateKey} = require("../../configVars.js");
var Yup = require("yup");

const USERNAME_REGEX = /^[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/;
const NAME_REGEX = /^[a-z ,.'-]+$/i;
var registerSchema = Yup.object().shape({
                        email:Yup.string().email().required(),
                        firstName:Yup.string().matches(NAME_REGEX, "firstName can contain only ASCII letters").required(),
                        lastName:Yup.string().matches(NAME_REGEX, "lastName can contain only ASCII letters").required(),
                        userName:Yup.
                            string().
                                matches(USERNAME_REGEX, 
`userName can contain only ASCII letters and digits, with hyphens,and underscores. userName can only begin and end with ASCII letters or digits.`).
                                    required(),
                        password:Yup.string().required(),
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
                }
            }). 
                catch(error => {
                    response.status(400).json({message:"REGISTER failed at second validation phase >> check malformed body", data:error});
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

                    next();
                }
            }).
                catch(error => {
                    response.status(400).json({message:"LOGIN failed at second validation phase >> check malformed body", data:error});
                })
};
//middleware that makes sure all incoming username/email is trimmed and lower cased based on what is not undefined
function lowerCaseUE(request, _, next){
    function convert(string){
        var arr = [];
        for(let i of string.trim().split("")){
            arr.push(i.toLowerCase());
        }
        return arr.join("")
    }

    var{email, userName} = request.body;

    if(email){
        request.body.email = convert(request.body.email);
    }
    if(userName){
        request.body.userName = convert(request.body.userName);
    }

    next();
}

userRouter.use(lowerCaseUE);

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
                            if (result == null){
                                response.status(400).json({message:`Invalid ${headers.loginType}/password`});
                            }else{
                                bcrypt.compare(password, result.password). 
                                    then(valid => {
                                        if(valid){
                                            jwt.sign({email, _id:result._id}, privateKey, {expiresIn:"1h"}, (error, token) => {
                                                if(error){
                                                    response.status(500).json({"error":error}); 
                                                }else{
                                                    //final stop if all goes well
                                                    response.cookie('auth', token).status(200).json({message:"logged in", _id:result._id});
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

           });

function protectRoute(request, response, next){
    var {auth} = request.cookies;
    if(auth){
        jwt.verify(auth, privateKey, (error, token) => {
            if(error){
                response.status(401).json({message:"Unauthorized please login"});
                /*
                    when the user signs in, user is sent a cookie with a token in it
                    and is also sent back a response with the user id to be put in the headers
                    the token is an encrypted JSON object containing the users id.
                    ONLY if the users current cookie has an a user id that is equal to the headers user id 
                    may he or she proceed.
                    in other words if someone gains access to your user id they cant do anything unless they have your cookie
                    and vise versa you need both
                */
            }else if(token._id == request.headers._id){
                next();
            }else{
                //in case user has logged into another account and has a cookie set to a token containing a different user _id
                response.status(401).json({message:"Unauthorized please login again"});
            }
        })
    }else{
        response.status(401).json({message:"Unauthorized please login"});
    }
}
//get user personal information
userRouter. 
    route("/settings").
        all(protectRoute).
            get((request, response) => {
                UserModel.findById(request.headers._id). 
                    then((data => {
                        response.status(200).json({data});
                    })). 
                        catch(error => {
                            response.status(500).json({"error":error});
                        })
            }). 
            put((request, response) => {
                //THE BODY OF THE REQUEST WILL ONLY CONTAIN DATA THAT NEEDS TO BE UPDATED

                //if the body contains password it will need a key of oldPassword as well;
                {// block scope just to check for body keys
                    let {password, oldPassword} = request.body;
                    if(password && oldPassword == undefined){
                        response.status(400).json({message:"The body contains password it will need a key of oldPassword"});
                    }else if(oldPassword && password == undefined){
                        response.status(400).json({message:"The body contains oldPassword it will need a key of password"});
                        //if both truthy and are equal strings
                    }else if(oldPassword && password && oldPassword == password){
                        response.status(400).json({message:"Both old and new passwords are the same"});
                    }
                }
                
                
                var allowedData = ["password", "firstName", "lastName", "userName", "email" ];
                //generator will make adding async updates easier down the road it iterates only over data thats allowed to be updated
                function* update(){
                    //field[0] == key && field[1] == value;
                    for(let field of Object.entries(request.body)){
                        if (field[0] == "password" ){
                            yield new Promise((resolve, reject) => {
                            //find user by id then compare hash if all good, hash new pass and resolve that
                              UserModel.findById(request.headers._id). 
                                then(result => {
                                    if(result == null){
                                        reject({message:"Invalid user id please log in again", status:401})
                                    }else{
                                        //comparing oldPassword with current hashed password
                                        bcrypt.compare(request.body.oldPassword, result.password). 

                                            then(valid => {
                                                if(valid){

                                                    //hash new password
                                                    bcrypt.hash(field[1], 8). 
                                                    then(hash => {
                                                        resolve({"password":hash})
                                                    }). 
                                                        catch(error => {
                                                            reject({message:`BCRYPT_ERROR ${error}`, status:500})
                                                        })
                                                }else{
                                                    reject({message:"oldPassword is invalid", status:400})
                                                }
                                                
                                            })
                                    }
                                })
                                
                            })
                        }else if (allowedData.includes(field[0])){
                            //everything else can be updated normaly
                            yield Promise.resolve({[field[0]]:field[1]});
                        }
                    }
                 
                }
                Promise.all([...update()]).
                    then(result => {
                       //Result is an ARRAY of objects eg. [{userName:"YuNo25"}, {email:"example@memefly.com"}] of updated fields only
                       
                      
                        UserModel.
                         //Geting the logged in user Object so we can make a completely new user object by adding updated fields
                            findById(request.headers._id). 
                                then((user) => {

                                    result.
                                        forEach((field) => {
                                            //add the updated fields to the user
                                            Object.assign(user, field);
                                        })
                                    //final validation for user object is the same as registration
                                    registerSchema.validate(user). 
                                        then(user => {
                                            UserModel.updateOne({_id:request.headers._id}, user). 
                                                then( () => {
                                                    //final stop if all went well
                                                    response.status(201).json({message:"OK Updated",});
                                                }). 
                                                catch(error => {
                                                    //check for unique constraint
                                                    if(error.code == 11000){

                                                        //parse error message to give back a more defined response
                                                        var value = error.errmsg.split(`"`)[1];
                                                        var uniqueConstraint;
                                                        /*iterate through the document of user object
                                                        to find the correct key name of our unique constraint's value*/
                                                        for(let entry of Object.entries(user._doc)){

                                                            if(entry[1] == value){
                                                                uniqueConstraint = entry[0];

                                                            }
                                                        }
                                                        //a defined response for front end
                                                        response.status(400).json({message: `${uniqueConstraint} ${value} already taken`, uniqueConstraint, value});
                                                    }else{
                                                        //all other mongoose errors end up here
                                                        response.status(500).json({"error":error});
                                                    }
                                                }) 
                                        }). 
                                            catch(error => {
                                                //validation errors end up here 
                                                response.status(400).json({message:"UPDATE failed at second validation phase >> check malformed body", data:error})
                                            })
                                }). 
                                    catch(error => {
                                        //all other errors end up here
                                        response.status(500).json({"error":error})
                                    })
                        
                    }).catch(error => {
                        //rejected promises will end up here from the generator
                        response.status(error.status).json({message:error.message})
                    })
            })

module.exports = userRouter;