require('dotenv').config();
import express, { response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema, CreateProjectSchema, SaveProject } from "@repo/common/types";
import { middleware } from "./middleware";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prismaClient } from "@repo/db/client";

const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));



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
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.email,
                password: parsedData.data.password,
                name: parsedData.data.name,
            }
        })

        res.json({
            userId: user.id
        })
    }
    catch (e) {
        res.status(411).json({
            message: "User Already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error)
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.email,
            password: parsedData.data.password
        }
    })
    if (!user) {
        res.status(403).json({
            message: "Not auth"
        })
        return;
    }
    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);
    res.cookie("authorization", token, {
        httpOnly: true,
        secure: true, // only over HTTPS
        sameSite: "strict",
    });


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

    //@ts-ignore
    const user = req.userId

    try {
        const file = await prismaClient.file.create({
            data: {
                name: parsedData.data.tittle,
                data: parsedData.data.data,
                userId: user
            }
        })
        res.json({
            fileId: file.id
        })
    }
    catch (e) {
        // console.log(e)
        res.status(411).json({
            message: "something went wrong"
        })
    }
})

app.post("/saveproject", middleware, async (req, res) => {
    //@ts-ignore
    const user = req.userId

    const parsedData = SaveProject.safeParse(req.body)
    try {
        const saveFile = await prismaClient.file.update({
            //@ts-ignore
            where: {
                id: parsedData.data?.id
            },
            data: {
                data: parsedData.data?.data
            }
        })
        res.json({
            "message": "Done"
        })

    } catch (error) {
        console.log(error)
    }
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