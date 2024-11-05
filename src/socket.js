import { Server } from "socket.io"

let io

function initSocket(server) {
    io = new Server(server)
}

export { initSocket, io }