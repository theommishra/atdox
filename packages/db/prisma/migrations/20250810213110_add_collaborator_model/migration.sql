-- Add password column to User table
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- Create Collaborator table
CREATE TABLE "Collaborator" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "Collaborator_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX "Collaborator_fileId_userId_key" ON "Collaborator"("fileId", "userId");

-- Add foreign key constraints
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Collaborator" ADD CONSTRAINT "Collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update File table to make userId NOT NULL
ALTER TABLE "File" ALTER COLUMN "userId" SET NOT NULL;
