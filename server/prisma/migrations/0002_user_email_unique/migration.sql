-- Auth.js PrismaAdapter resolves users by email during OAuth sign-in.
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
