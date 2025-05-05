require('dotenv').config();
import express, { response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema, CreateProjectSchema, SaveProject } from "@repo/common/types";
import { middleware } from "./middleware";
import { GoogleGenerativeAI } from '@google/generative-ai';
const app = express();

app.use(express.json());



app.post("/signup", async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error)
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        console.log(parsedData)
    }
    catch (e) {
        res.status(411).json({
            message: "User Already exists with this username"
        })
    }
})

app.get("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error)
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    const user = {
        username: parsedData.data.username,
        password: parsedData.data.password
    }
    const token = jwt.sign({
        userId: user.username
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/createProject", middleware, async (req, res) => {
    const parsedData = CreateProjectSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error)
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        console.log(parsedData)
    }
    catch (e) {
        res.status(411).json({
            message: "User Already exists with this username"
        })
    }
})

app.post("/saveproject", async (req, res) => {
    const doc = SaveProject.safeParse(req.body)
    console.log(doc.data?.content)
})
//@ts-ignore
app.post("/hitapi", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.status(200).json({ response: responseText });

    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Something went wrong' });
    }
});


app.listen(3002);