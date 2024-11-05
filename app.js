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

let categoryPoints = [100, 300, 700, 1000]

let boardLayout = { revealed: [], scrambled: [] }
scrambleBoard()

io.on("connection", socket => {
    console.log("New connection")
    sendGame()
    
    socket.on("join-team", id => {
        if (!teams[id]) return socket.emit("invalid-team")
        socket.data.teamID = id
        socket.emit("join-team", { team: teams[id], id })
        sendBoard()
        sendGame()
    })

    socket.on("create-team", async ({name}) => {
        let id = ""
        do {
            id = Math.random().toString(36).slice(2)
        } while (teams[id])

        teams[id] = { name, score: 0 }

        socket.emit("join-team", { team: teams[id], id })
        sendBoard()
        sendGame()

        await fs.writeFile("./data/teams.json", JSON.stringify(teams, null, 4))
    })

    socket.on("submit-guess", async ({ team, guess, words }) => {
        game.rounds[game.round].guesses[team] = {
            submitted: true,
            guess, words,
            correct: null,
            category: null,
            points: 0,
        }

        calculateRoundPoints()

        sendGame()

        await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
    })

    socket.on("reveal-category", async category => {
        game.rounds[game.round].board[category].revealed = true
        sendBoard()
        sendGame()

        await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
    })
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

function sendGame() {
    io.emit("update-game", {game, teams})
    // io.to("admin").emit("update-game", game)
}

function findGuessCategories() {
    // find the category that each guess belongs to
    // it is only valid if all 4 words are of the same category
    // if not, guess.category remains null

    let round = game.rounds[game.round]
    
    for(let team in round.guesses) {
        let guess = round.guesses[team]
        let category = null

        for(let i = 0; i < round.board.length; i++) {
            if (round.board[i].words.includes(guess.words[0])) {
                if (guess.words.every(word => round.board[i].words.includes(word))) {
                    category = i
                    break
                }
            }
        }

        guess.category = category
    }
}

function calculateRoundPoints() {
    // if a guess is correct, the points get split between all teams that guessed that category correctly.

    findGuessCategories()

    let round = game.rounds[game.round]
    let correctCategories = {}

    for(let team in round.guesses) {
        let guess = round.guesses[team]

        if (guess.correct) {
            if (!correctCategories[guess.category]) correctCategories[guess.category] = []
            correctCategories[guess.category].push(team)
        }
    }

    let teamPoints = {}

    for(let category in correctCategories) {
        let points = categoryPoints[category]
        let teams = correctCategories[category]

        for(let team of teams) {
            teamPoints[team] = points / teams.length
        }
    }

    for(let team in teamPoints) {
        round.guesses[team].points = teamPoints[team]
    }

    return teamPoints
}

server.listen(3000, () => console.log("Server running on port 3000"))