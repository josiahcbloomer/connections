import fs from "fs/promises"
import express from "express"
import { createServer } from "http"
import { initSocket, io } from "./src/socket.js"

const app = express()
const server = createServer(app)
initSocket(server)

app.use(express.static("public"))

let game = JSON.parse(await fs.readFile("./data/game.json"))
let teams = JSON.parse(await fs.readFile("./data/teams.json"))

let boardLayout = { revealed: [], scrambled: [] }
scrambleBoard()

io.on("connection", socket => {
    console.log("New connection")
    socket.emit("update-game", game)
    sendBoard()
})

function scrambleBoard() {
    let round = game.rounds[game.round]
    let board = round.board

    // full list of tiles
    let revealedCategories = []
    let scrambledTiles = []
    
    // add all the tiles to the list
    for(let row of board) {
        if (row.revealed) {
            revealedCategories.push({
                description: row.description,
                words: row.words,
                color: board.indexOf(row)
            })
        } else {
            scrambledTiles.push(...row.words)
        }
    }

    // shuffle the tiles
    for(let i = scrambledTiles.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * i)
        let temp = scrambledTiles[i]
        scrambledTiles[i] = scrambledTiles[j]
        scrambledTiles[j] = temp
    }

    boardLayout = { revealed: revealedCategories, scrambled: scrambledTiles }
}

function sendBoard() {
    io.emit("update-board", boardLayout)
}

server.listen(3000, () => console.log("Server running on port 3000"))