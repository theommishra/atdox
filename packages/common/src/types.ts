import {z} from "zod";

export const CreateUserSchema = z.object({
    username:z.string().min(3).max(20),
    password:z.string(),
    name:z.string()
})

export const SigninSchema = z.object({
    username: z.string().min(3).max(20),
    password: z.string(),
})

export const CreateProjectSchema = z.object({
    tittle:z.string(),
    desc:z.string()
})

export const SaveProject = z.object({
    id: z.string(),
    content: z.string()
})