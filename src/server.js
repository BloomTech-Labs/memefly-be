"use strict"
import express from "express";
import UserRouter from "./routes/UserRouter.js";
import socket from "socket.io";
import http from "http";
import {DirectMessageModel, AccountModel} from "./models"
import moment from "moment";

import cors from "cors";
const PORT = process.env.PORT || 5000;
var app = express();

app.use(function(_, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
 });

app.use(express.json());
app.use("/api", UserRouter);

var server = http.Server(app);
var io = socket(server);


io.on("connection",(socket) => {

    socket.on("create", async function(DMRoom){  
        socket.join(DMRoom);
        try{
            var directMessage = await DirectMessageModel.findOne({_id:DMRoom})
            if(directMessage == undefined){
                throw "DMroom has not been created";
            }
            var {user_pool} = directMessage;
            var userAccounts = 
            await Promise.all(user_pool.map( async (_id) => {
                    return await AccountModel.findById(_id);
                }));

            io.sockets.in(DMRoom).emit("connected", "you are now chatting");
        }catch(error){
            console.error(error);
            return socket.leave(DMRoom);
        }  
        socket.on("chat", async (data) => {
            //find index of userAccounts from data.username
            console.log("saving data");
            try{
                if(userAccounts == undefined){
                    throw "there is no one to chat with";
                }
                var dm = await DirectMessageModel.updateOne(directMessage, {$push:{messages:{username:data.username, message:data.message, timestamp:moment().format('MMMM Do YYYY, h:mm:ss a')}}});
                console.log(dm)
                if(dm.nModified){
                    console.log("logged message");
                }else{
                    throw "Could not save data";
                }
            }catch(error){
                console.error(error);
                return DMRoom
            }
            
        })  
    })
})



server.listen(PORT, function logMessage(){
    console.log("App is online running on *:%s", PORT)
})

