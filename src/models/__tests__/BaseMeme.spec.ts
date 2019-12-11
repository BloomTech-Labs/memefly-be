if (process.env.NODE_ENV != "production"){
    var dotenv = require("dotenv");
    dotenv.config()
}
import { expect } from "chai";
import BaseMemeModel from "../GenMeme";
import "mocha";


describe("BaseMemesModel", () => {
    it("returns base memes array", async () => {
        let memes = await BaseMemeModel.find();
        expect(memes.length).to.be.gte(108);
    })
})