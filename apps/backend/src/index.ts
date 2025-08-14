require('dotenv').config();
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateUserSchema, SigninSchema, CreateProjectSchema, SaveProject, AddCollaboratorSchema, RemoveCollaboratorSchema, UpdateCollaboratorRoleSchema } from "@repo/common/types";
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
    origin: true, // Allow all origins for testing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    callbackURL: "/api/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile); // You can save to DB here
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        try {
            const profile = req.user as any;
            const googleEmail = profile.emails[0].value;

            // Check if user exists
            let user = await prismaClient.user.findUnique({
                where: {
                    email: googleEmail
                }
            });

            // If user doesn't exist, create new user
            if (!user) {
                user = await prismaClient.user.create({
                    data: {
                        email: googleEmail,
                        name: profile.displayName,
                        password: "google-auth-" + Math.random().toString(36).slice(-8) // Random password for Google users
                    }
                });
                console.log("New user created:", user.email);
            } else {
                // Update existing user's information
                user = await prismaClient.user.update({
                    where: {
                        email: googleEmail
                    },
                    data: {
                        name: profile.displayName,
                        // You might want to update other fields here if needed
                    }
                });
                console.log("Existing user signed in and updated:", user.email);
            }

            // Generate JWT token
            const token = jwt.sign({
                userId: user.id
            }, JWT_SECRET);

            // Set cookie
            res.cookie("authorization", token, {
                secure: false,
                path: "/",
            });

            // Redirect with status parameter
            const redirectUrl = process.env.FRONTEND_URL as string;
            const status = user ? "signin" : "signup";
            res.redirect(`${redirectUrl}?status=${status}`);
        } catch (error) {
            console.error("Error in Google auth callback:", error);
            res.redirect(process.env.FRONTEND_URL as string + "?error=auth_failed");
        }
    });

app.get("/api/user", (req, res) => {
    res.send(req.user);
});

app.get("/api/user/permissions", middleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Authentication required"
        });
        return;
    }

    try {
        // Get user info
        const user = await prismaClient.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true
            }
        });

        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        // For now, all authenticated users are considered owners (can edit)
        // In the future, this could be expanded to check specific permissions
        res.json({
            role: 'owner',
            isOwner: true,
            userId: user.id,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        console.error('Error fetching user permissions:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

app.post("/api/signup", async (req, res) => {
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
});

app.post("/api/signin", async (req, res) => {
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
    
    // Set cookie for same-domain requests
    res.cookie("authorization", token, {
        secure: true, // HTTPS only
        sameSite: 'none', // Allow cross-site
        path: "/",
    });

    res.json({
        token,
        userId: user.id,
        message: "Sign in successful"
    })
});

app.post("/api/signout", (req, res) => {
    res.clearCookie("authorization");
    res.status(200).json({ message: "Signed out successfully" });
});

app.get("/api/allprojects", middleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.userId;

    if (!userId) {
        res.status(401).json({
            message: "Authentication required"
        });
        return;
    }

    try {
        // Get projects the user owns
        const ownedProjects = await prismaClient.file.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                userId: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Get projects where the user is a collaborator
        const collaboratedProjects = await prismaClient.collaborator.findMany({
            where: {
                userId: userId
            },
            select: {
                role: true,
                file: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                        updatedAt: true,
                        userId: true
                    }
                }
            }
        });

        // Combine and format the results, avoiding duplicates
        const ownedProjectIds = new Set(ownedProjects.map(p => p.id));
        const allProjects = [
            ...ownedProjects.map(project => ({
                ...project,
                role: 'owner',
                isOwner: true
            })),
            ...collaboratedProjects
                .filter(collab => !ownedProjectIds.has(collab.file.id)) // Don't include if user already owns this project
                .map(collab => ({
                    ...collab.file,
                    role: collab.role,
                    isOwner: false
                }))
        ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        // Debug logging
        console.log('Owned projects count:', ownedProjects.length);
        console.log('Collaborated projects count:', collaboratedProjects.length);
        console.log('Final allProjects:', allProjects.map(p => ({ id: p.id, name: p.name, isOwner: p.isOwner, role: p.role })));

        // Log the exact response being sent
        const responseData = {
            projects: allProjects || []
        };
        console.log('Sending response:', JSON.stringify(responseData, null, 2));

        res.setHeader('Content-Type', 'application/json');
        res.json(responseData);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({
            message: "Failed to fetch projects"
        });
    }
});

app.get("/api/getProject/:id", middleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.userId;
    const projectId = req.params?.id ? parseInt(req.params.id) : null;

    console.log('=== BACKEND GETPROJECT DEBUG ===');
    console.log('Requested project ID:', projectId);
    console.log('User ID from middleware:', userId);

    if (!userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    if (!projectId || isNaN(projectId)) {
        res.status(400).json({ message: "Invalid project ID" });
        return;
    }

    try {
        // Check ownership first
        console.log('Executing ownership query for fileId:', projectId, 'userId:', userId);
        let project = await prismaClient.file.findFirst({
            where: { id: projectId, userId: userId },
            select: { id: true, name: true, data: true, createdAt: true, updatedAt: true }
        });

        console.log('Project found as owner:', !!project);
        if (project) {
            console.log('Owner project details:', project);
        }

        let role = 'owner';
        let isOwner = true;

        if (!project) {
            console.log('User is not owner, checking collaborator access...');
            console.log('Executing collaborator query for fileId:', projectId, 'userId:', userId);
            // If not owner, check collaborator access (view or edit)
            const collab = await prismaClient.collaborator.findFirst({
                where: { fileId: projectId, userId },
                select: { id: true, role: true }
            });
            console.log('Collaborator record found:', collab);
            
            if (!collab) {
                console.log('No collaborator record found, returning 404');
                res.status(404).json({ message: "Project not found" });
                return;
            }
            role = collab.role;
            isOwner = false;
            console.log('User is collaborator with role:', role);
            
            console.log('Fetching project data for collaborator...');
            project = await prismaClient.file.findUnique({
                where: { id: projectId },
                select: { id: true, name: true, data: true, createdAt: true, updatedAt: true }
            });
            console.log('Project data for collaborator:', project);
        }

        console.log('Final response data:', { 
            data: project?.data, 
            name: project?.name, 
            id: project?.id,
            role: role,
            isOwner: isOwner
        });
        console.log('=== END BACKEND GETPROJECT DEBUG ===');

        res.json({ 
            data: project?.data, 
            name: project?.name, 
            id: project?.id,
            role: role,
            isOwner: isOwner
        });
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ message: "Failed to fetch project" });
    }
});

app.post("/api/createProject", middleware, async (req: Request, res: Response): Promise<void> => {
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

app.post("/api/saveproject", middleware, async (req: Request, res: Response): Promise<void> => {
    //@ts-ignore
    const userId = req.userId;

    const parsedData = SaveProject.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid data format" });
        return;
    }

    try {
        // Check if user is owner or collaborator with edit role
        const file = await prismaClient.file.findUnique({ where: { id: parsedData.data.id } });
        if (!file) {
            res.status(404).json({ message: "File not found" });
            return;
        }

        let hasEditPermission = file.userId === userId;
        if (!hasEditPermission) {
            const collab = await prismaClient.collaborator.findFirst({
                where: { fileId: file.id, userId, role: "edit" }
            });
            hasEditPermission = !!collab;
        }

        if (!hasEditPermission) {
            res.status(403).json({ message: "You don't have permission to edit this file" });
            return;
        }

        const updateData: any = { data: parsedData.data.data };
        if (parsedData.data.name) {
            updateData.name = parsedData.data.name;
        }
        const saveFile = await prismaClient.file.update({
            where: { id: parsedData.data.id },
            data: updateData
        });
        
        res.json({ message: "File updated successfully", fileId: saveFile.id });
    } catch (error) {
        console.error("Update file error:", error);
        res.status(500).json({ message: "Failed to update file" });
    }
});

app.delete("/api/deleteproject", middleware, async (req: Request, res: Response): Promise<void> => {
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

app.get("/api/me", middleware, (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ authenticated: false });
        return;
    }
    res.json({ authenticated: true, userId });
});

// Collaborators APIs
app.get("/api/projects/:id/collaborators", middleware, async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.userId;
  const projectId = parseInt(req.params.id as string, 10);

  if (!projectId || isNaN(projectId)) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  try {
    const project = await prismaClient.file.findFirst({
      where: { id: projectId, userId },
      select: { id: true }
    });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    const collaborators = await prismaClient.collaborator.findMany({
      where: { fileId: projectId },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, email: true, name: true } }
      }
    });
    res.json({ collaborators });
  } catch (error) {
    console.error("Get collaborators error:", error);
    res.status(500).json({ message: "Failed to fetch collaborators" });
  }
});

app.post("/api/projects/:id/collaborators", middleware, async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.userId;
  const projectId = parseInt(req.params.id as string, 10);

  const parsed = AddCollaboratorSchema.safeParse({ ...req.body, projectId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid inputs" });
    return;
  }

  try {
    const project = await prismaClient.file.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const collaboratorUser = await prismaClient.user.findUnique({ where: { email: parsed.data.email } });
    if (!collaboratorUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Prevent adding owner as collaborator
    if (collaboratorUser.id === userId) {
      res.status(400).json({ message: "Owner is already a collaborator" });
      return;
    }

    const collaborator = await prismaClient.collaborator.upsert({
      where: { fileId_userId: { fileId: projectId, userId: collaboratorUser.id } },
      create: { fileId: projectId, userId: collaboratorUser.id, role: parsed.data.role },
      update: { role: parsed.data.role }
    });

    res.json({ message: "Collaborator added", collaboratorId: collaborator.id });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({ message: "Failed to add collaborator" });
  }
});

app.put("/api/projects/:id/collaborators", middleware, async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.userId;
  const projectId = parseInt(req.params.id as string, 10);
  const parsed = UpdateCollaboratorRoleSchema.safeParse({ ...req.body, projectId });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid inputs" });
    return;
  }
  try {
    const project = await prismaClient.file.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await prismaClient.collaborator.update({
      where: { fileId_userId: { fileId: projectId, userId: parsed.data.userId } },
      data: { role: parsed.data.role }
    });

    res.json({ message: "Collaborator role updated" });
  } catch (error) {
    console.error("Update collaborator error:", error);
    res.status(500).json({ message: "Failed to update collaborator" });
  }
});

app.delete("/api/projects/:id/collaborators", middleware, async (req: Request, res: Response) => {
  //@ts-ignore
  const userId = req.userId;
  const projectId = parseInt(req.params.id as string, 10);
  const parsed = RemoveCollaboratorSchema.safeParse({ projectId, userId: Number(req.query.userId) });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid inputs" });
    return;
  }
  try {
    const project = await prismaClient.file.findFirst({ where: { id: projectId, userId } });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    await prismaClient.collaborator.delete({
      where: { fileId_userId: { fileId: projectId, userId: parsed.data.userId } }
    });
    res.json({ message: "Collaborator removed" });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ message: "Failed to remove collaborator" });
  }
});



//@ts-ignore
app.post("/api/hitapi", async (req, res) => {
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

const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});