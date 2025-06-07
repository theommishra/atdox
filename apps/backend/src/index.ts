require('dotenv').config();
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema, CreateProjectSchema, SaveProject } from "@repo/common/types";
import { middleware } from "./middleware";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prismaClient } from "@repo/db/client";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000','https://atdox.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(session({
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile); // You can save to DB here
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL as string);
  });

app.get("/api/user", (req, res) => {
  res.send(req.user);
});

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
        // httpOnly: true,
        secure: false, // only over HTTPS
        // sameSite: "strict",
        path: "/",  
    });


    res.json({
        token
        
    })
})

app.post("/signout", (req, res) => {
  res.clearCookie("authorization");
  res.status(200).json({ message: "Signed out successfully" });
});

app.get("/allprojects", middleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Authentication required"
        });
        return;
    }

    try {
        const projects = await prismaClient.file.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        res.setHeader('Content-Type', 'application/json');
        res.json({
            projects: projects || []
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({
            message: "Failed to fetch projects"
        });
    }
});

app.get("/getProject/:id", middleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.userId;
    const projectId = req.params?.id ? parseInt(req.params.id) : null;

    if (!userId) {
        res.status(401).json({
            message: "Authentication required"
        });
        return;
    }

    if (!projectId || isNaN(projectId)) {
        res.status(400).json({
            message: "Invalid project ID"
        });
        return;
    }

    try {
        const project = await prismaClient.file.findFirst({
            where: {
                id: projectId,
                userId: userId
            },
            select: {
                id: true,
                name: true,
                data: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!project) {
            res.status(404).json({
                message: "Project not found"
            });
            return;
        }

        res.json({
            data: project.data,
            name: project.name,
            id: project.id
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({
            message: "Failed to fetch project"
        });
    }
});

app.post("/createProject", middleware, async (req: Request, res: Response): Promise<void> => {
    const parsedData = CreateProjectSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Incorrect inputs"
        });
        return;
    }

    //@ts-ignore
    const userId = req.userId;

    try {
        const file = await prismaClient.file.create({
            data: {
                name: parsedData.data.tittle,
                data: parsedData.data.data,
                userId: userId
            }
        });
        res.json({
            fileId: file.id,
            message: "File created successfully"
        });
    }
    catch (e) {
        console.error("Create file error:", e);
        res.status(500).json({
            message: "Failed to create file"
        });
    }
});

app.post("/saveproject", middleware, async (req: Request, res: Response): Promise<void> => {
    //@ts-ignore
    const userId = req.userId;

    const parsedData = SaveProject.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid data format"
        });
        return;
    }

    try {
        const saveFile = await prismaClient.file.update({
            where: {
                id: parsedData.data.id,
                userId: userId
            },
            data: {
                data: parsedData.data.data
            }
        });
        
        res.json({
            message: "File updated successfully",
            fileId: saveFile.id
        });
    } catch (error) {
        console.error("Update file error:", error);
        res.status(404).json({
            message: "File not found or you don't have permission to edit it"
        });
    }
});

app.delete("/deleteproject", middleware, async (req: Request, res: Response): Promise<void> => {
    //@ts-ignore
    const userId = req.userId;
    const projectId = parseInt(req.query.id as string);

    if (!projectId || isNaN(projectId)) {
        res.status(400).json({
            message: "Invalid project ID"
        });
        return;
    }

    try {
        const deletedFile = await prismaClient.file.delete({
            where: {
                id: projectId,
                userId: userId
            }
        });
        
        res.json({
            message: "Project deleted successfully",
            fileId: deletedFile.id
        });
    } catch (error) {
        console.error("Delete file error:", error);
        res.status(404).json({
            message: "File not found or you don't have permission to delete it"
        });
    }
});

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



// console.log(process.env.GEMINI_API_KEY as string);


app.listen(3002);