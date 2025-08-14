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
    data: z.string(),
    name: z.string().optional()
})

// Collaborators
export const CollaboratorRoleSchema = z.enum(["view", "edit"]);

export const AddCollaboratorSchema = z.object({
    projectId: z.number(),
    email: z.string().email(),
    role: CollaboratorRoleSchema
});

export const RemoveCollaboratorSchema = z.object({
    projectId: z.number(),
    userId: z.number()
});

export const UpdateCollaboratorRoleSchema = z.object({
    projectId: z.number(),
    userId: z.number(),
    role: CollaboratorRoleSchema
});