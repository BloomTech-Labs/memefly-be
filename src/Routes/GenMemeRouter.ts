import express from "express";
import graphqlHTTP from "express-graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import BaseMemeModel from "../models/GenMeme";
import {parseMongooseError} from "./utils/parseMongooseError";
var typeDefs = importSchema("./src/graphql/GenMemeSchema.graphql");
interface IGenMeme{
  meme_id?:Number;
  meme_name?:String;
  meme_bounding_box?:Array<String>;
  meme_url?:String;
  meme_text?:Array<String>;
  message:String;
  fetched:Boolean
}

interface IGenMemeArgs{
  id:Number;
  rand:Boolean;
}

var root = {
    async generateMeme(args:IGenMemeArgs):Promise<IGenMeme>{
      var message:IGenMeme = {message:"init", fetched:false}
      try{
        let {id, rand} = args
        if(id == undefined && rand == undefined){
          throw "Invalid Query you must provide either an id or a rand:true";
        }
        let filter = {
          meme_id:rand? Math.floor(Math.random() * 108): id
        }
        let meme = await BaseMemeModel.findOne(filter);

        meme = meme? meme.toObject():undefined;
        if(meme != undefined){
      
          message = {message:`${rand ? "Randomly ":""}Selected ${meme.meme_name}`, ...meme, fetched:true}
        }else{
          throw `could not fetch meme`
        }
      }catch(error){
            message = {message:parseMongooseError(error), fetched:false};
      }finally{
        return message
      }
    },
    async getAll():Promise<Array<any>>{
      let memes:any = await BaseMemeModel.find();
  
      return memes.map((x:any) => {
        return {...x.toObject()}
      })
    }
}

var schema = makeExecutableSchema({
  typeDefs,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  }
});
var BaseMemesRouter = express.Router();

BaseMemesRouter.use("/memes/base", graphqlHTTP(() => {
  return {schema, rootValue: root, graphiql:true}}))
export default BaseMemesRouter;