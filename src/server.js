"use strict"
import express from "express";
import UserRouter from "./routes/UserRouter.js";
import MemeRouter from "./routes/MemeRouter.js";
import socket from "socket.io";
import http from "http";
import {DirectMessageModel, AccountModel} from "./models"
import cors from "cors";
const PORT = process.env.PORT || 5000;


var app = express();

app.use(cors({credentials:true, origin:"http://localhost:3000", allowedHeaders:{
    "Access-Control-Expose-Headers":"set-cookie"
}}) );

app.use("/api", UserRouter);
app.use("/api", MemeRouter);
var server = http.Server(app);

server.listen(PORT, function logMessage(){
    console.log("App is online running on *:%s", PORT)
})

var io = socket(server);


io.on('connection', function (socket) {
    socket.on("create", async function(DMRoom){  
        console.log("connection made")
        console.log(DMRoom);
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
            console.error(error, "<<<<<<<<<<<<<<<<<<<<<<<");
            return socket.leave(DMRoom);
        }  
        socket.on("chat", async (data) => {
            //find index of userAccounts from data.username
            
            try{
                if(userAccounts == undefined){
                    throw "there is no one to chat with";
                }
                var message = {username:data.username, message:data.message}
                var dm = await DirectMessageModel.updateOne({_id:directMessage._id}, {$push:{messages:message}});
                console.log(dm)
                io.sockets.in(DMRoom).emit("chat", data);
                if(dm.nModified){
                   
                }else{
                    console.log(dm);
                    throw "Could not save data";
                }
            }catch(error){
                console.error(">>>>>>>>>>>>>>>>>>>>",error);
                return DMRoom
            }
            
        })  
    })
  });
