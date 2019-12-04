import mongoose, { Document, Schema } from "mongoose";
import {envConfig} from "../config";
var {URI} = envConfig;
import {options} from "./options";

interface IBase_Meme extends Document {
    meme_id:Number;
    meme_name:String;
    meme_bounding_box:Array<String>;
    meme_url:String;
    meme_text:Array<String>;
}
var conn = mongoose.createConnection(URI, options);
var BaseMemeModel = conn.model<IBase_Meme>("base_meme", new Schema({}));
export default BaseMemeModel;