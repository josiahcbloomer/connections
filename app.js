import fs from "fs/promises"
import express from "express"
import { createServer } from "http"
import { initSocket, io } from "./src/socket.js"

const app = express()
const server = createServer(app)
initSocket(server)

app.use(express.static("public"))

io.on("connection", socket => {
    
})

server.listen(3000, () => console.log("Server running on port 3000"))