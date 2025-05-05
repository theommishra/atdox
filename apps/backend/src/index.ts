import express from "express";
import jwt from "jsonwebtoken";
import {JWT_SECRET} from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema,CreateProjectSchema,SaveProject} from "@repo/common/types";
import { middleware } from "./middleware";
const app = express();

app.use(express.json());

app.post("/signup",async (req,res)=>{
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        console.log(parsedData.error)
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    try{
        console.log(parsedData)
    }
    catch(e){
        res.status(411).json({
            message:"User Already exists with this username"
        })
    }
})

app.get("/signin",async(req,res)=>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        console.log(parsedData.error)
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    const user = {
        username:parsedData.data.username,
        password:parsedData.data.password
    }
    const token = jwt.sign({
        userId: user.username
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/createProject",middleware,async (req,res)=>{
    const parsedData = CreateProjectSchema.safeParse(req.body);
    if(!parsedData.success){
        console.log(parsedData.error)
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    try{
        console.log(parsedData)
    }
    catch(e){
        res.status(411).json({
            message:"User Already exists with this username"
        })
    }
})

app.post("/saveproject", async(req,res)=>{
    const doc = SaveProject.safeParse(req.body)
    console.log(doc.data?.content)
})




app.listen(3002);