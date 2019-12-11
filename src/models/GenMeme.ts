import mongoose, { Document, Schema } from "mongoose";
import {envConfig} from "../config";
var {URI} = envConfig;
import {options} from "./options";

interface IGenMeme extends Document {
    meme_id:Number;
    meme_name:String;
    meme_bounding_box:Array<String>;
    meme_url:String;
    generated_meme_texts:Array<String>;
}
var conn = mongoose.createConnection(URI, options);
var BaseMemeModel = conn.model<IGenMeme>("generated_meme", new Schema({}));
export default BaseMemeModel;