import express from "express";
import graphqlHTTP from "express-graphql";
import {buildSchema} from "graphql";
import BaseMemeModel from "../models/BaseMeme";

var root = {
    async getBaseMemes(){
        return await BaseMemeModel.find();
    }
}

var schema = buildSchema(`
  type base_memes{
    meme_id:Int!
    meme_name:String!
    meme_bounding_box:[String!]
    meme_url:String!
    meme_text:[String!]
  }
  type Query{
    getBaseMemes:[base_memes]
  }
`)
  
var BaseMemesRouter = express.Router();

BaseMemesRouter.use("/memes/base", graphqlHTTP(() => {
  return {schema, rootValue: root}}))
export default BaseMemesRouter;