import * as dotenv from "dotenv";
import http from "http";
import app from "./app";
import { mongo } from './src/database/connection';
import cookieParser from 'cookie-parser';
app.use(cookieParser())
const server = http.createServer(app);

dotenv.config();
mongo().catch(console.error);

// ADD Routes
import auth from './src/routes/auth';
import user from './src/routes/user';
import project from './src/routes/project';
import picture from './src/routes/picture';

// Use Routes
app.use("/", auth);
app.use("/user", user);
app.use("/project", project);
app.use("/picture", picture);

const port = process.env.PORT || 8080;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});