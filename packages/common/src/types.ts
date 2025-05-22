import {z} from "zod";

export const CreateUserSchema = z.object({
    
    email:z.string().email(),
    password:z.string(),
    name:z.string(),
})

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const CreateProjectSchema = z.object({
    tittle:z.string(),
    data:z.string()
})

export const SaveProject = z.object({
    id:z.number(),
    data: z.string()
})
