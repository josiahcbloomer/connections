import fs from "fs/promises"
import express from "express"
import { createServer } from "http"
import { initSocket, io } from "./src/socket.js"

const app = express()
const server = createServer(app)
initSocket(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static("public"))

let game = JSON.parse(await fs.readFile("./data/game.json"))
let teams = JSON.parse(await fs.readFile("./data/teams.json"))

for(let team in teams) {
    teams[team].connected = false
}

let boardLayout = { revealed: [], scrambled: [] }
scrambleBoard()

app.get("/api/game", (req, res) => {
	res.json({ game, teams })
})

app.put("/api/rounds/:round/board", async (req, res) => {
    let round = game.rounds[req.params.round]
    round.board = req.body.board

    res.json({ game, teams })

    updateBoard()
    sendBoard()

    await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
})

app.put("/api/rounds/:round/move/:dir", async (req, res) => {
    let { round, dir } = req.params
    let move = dir == "up" ? -1 : 1

    round = parseInt(round)

    console.log(round, move)

    console.log(game.rounds[round + move])

    let temp = structuredClone(game.rounds[round + move])
    game.rounds[round + move] = structuredClone(game.rounds[round])
    game.rounds[round] = temp

    res.json({ game, teams })

    await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
})

app.delete("/api/rounds/:round", async (req, res) => {
    game.rounds.splice(req.params.round, 1)

    res.json({ game, teams })

    await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
})

app.post("/api/round", (req, res) => {
    game.rounds.push({
        board: [
            { description: "", words: [], revealed: false },
            { description: "", words: [], revealed: false },
            { description: "", words: [], revealed: false },
            { description: "", words: [], revealed: false },
        ],
        guesses: [{}],
        turn: 0,
    })

    res.json({ game, teams })
})

io.on("connection", socket => {
	console.log("New connection")
    if(socket.data.teamID) {
        teams[socket.data.teamID].connected = true
    }
	sendGame()
    sendBoard()

	socket.on("join-team", id => {
		if (!teams[id]) return socket.emit("invalid-team")
		socket.data.teamID = id
        teams[id].connected = true
		socket.emit("join-team", { team: teams[id], id })
		sendBoard()
		sendGame()
	})

	socket.on("create-team", async ({ name }) => {
		let id = ""
		do {
			id = Math.random().toString(36).slice(2)
		} while (teams[id])

		teams[id] = { name, score: 0, connected: true }

		socket.emit("join-team", { team: teams[id], id })
		sendBoard()
		sendGame()

		await fs.writeFile("./data/teams.json", JSON.stringify(teams, null, 4))
	})

	socket.on("submit-guess", async ({ team, guess, words }) => {
		let round = game.rounds[game.round]
		let turn = round.guesses[round.turn]

		turn[team] = {
			submitted: true,
			guess,
			words,
			correct: false,
			category: null,
			points: 0,
		}

		calculateTurnPoints()

		sendGame()

		await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
	})

	socket.on("delete-guess", async team => {
		let round = game.rounds[game.round]
		let turn = round.guesses[round.turn]
		delete turn[team]

		calculateTurnPoints()
		sendGame()

		await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
	})

	socket.on("reveal-category", async ({ category }) => {
		let round = game.rounds[game.round]
		let boardCategory = round.board[category]
		if (boardCategory.revealed) {
			boardCategory.revealed = false
			scrambleBoard()
		} else {
			boardCategory.revealed = true
			updateBoard()
		}
		sendBoard()
		sendGame()

		await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
	})

	socket.on("scramble-board", async () => {
		scrambleBoard()
		sendBoard()
	})

	socket.on("next", () => {
		let categoriesRevealed = 0
		let round = game.rounds[game.round]
		for (let category of round.board) {
			if (category.revealed) categoriesRevealed++
		}

		applyTurnPoints()

		if (categoriesRevealed >= 4) {
            if (game.round < game.rounds.length - 1) {
			    game.round++
                scrambleBoard()
                sendBoard()
            } else console.log("no rounds left")
		} else {
			round.turn++
			round.guesses[round.turn] = {}
		}

		sendGame()

		fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
	})

	socket.on("create-round", () => {
		
		sendGame()
	})

	socket.on("update-guess-correct", async ({ team, correct }) => {
		let round = game.rounds[game.round]
		let turn = round.guesses[round.turn]
		turn[team].correct = correct
		calculateTurnPoints()
		sendGame()

		await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
	})

    socket.on("reset", async () => {
        game.round = 0
        for(let round of game.rounds) {
            round.turn = 0
            round.guesses = [{}]
            for(let category of round.board) {
                category.revealed = false
            }
        }
        teams = {}

        scrambleBoard()
        sendBoard()

        sendGame()
        io.emit("refresh")
        await fs.writeFile("./data/game.json", JSON.stringify(game, null, 4))
    })

    socket.on("disconnect", () => {
        if(socket.data.teamID) {
            teams[socket.data.teamID].connected = false
            sendGame()
        }
    })
})

function scrambleBoard() {
	let round = game.rounds[game.round]
	let board = round.board

	// full list of tiles
	let revealedCategories = []
	let scrambledTiles = []

	// add all the tiles to the list
	for (let row of board) {
		if (row.revealed) {
			revealedCategories.push({
				description: row.description,
				words: row.words,
				color: board.indexOf(row),
			})
		} else {
			scrambledTiles.push(...row.words)
		}
	}

	// shuffle the tiles
	for (let i = scrambledTiles.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * i)
		let temp = scrambledTiles[i]
		scrambledTiles[i] = scrambledTiles[j]
		scrambledTiles[j] = temp
	}

	boardLayout = { revealed: revealedCategories, scrambled: scrambledTiles }
}

function updateBoard() {
	let round = game.rounds[game.round]
	let board = round.board

	// full list of tiles
	let revealedCategories = []
	let scrambledTiles = []

	// add all the tiles to the list
	for (let row of board) {
		if (row.revealed) {
			revealedCategories.push({
				description: row.description,
				words: row.words,
				color: board.indexOf(row),
			})
		}
	}

	for (let tile of boardLayout.scrambled) {
		if (revealedCategories.some(category => category.words.includes(tile))) continue
		scrambledTiles.push(tile)
	}

	boardLayout = { revealed: revealedCategories, scrambled: scrambledTiles }
}

function sendBoard() {
	io.emit("update-board", boardLayout)
}

function sendGame() {
	io.emit("update-game", { game, teams })
}

function findGuessCategories() {
	// find the category that each guess belongs to
	// it is only valid if all 4 words are of the same category
	// if not, guess.category remains null

	let round = game.rounds[game.round]
	let turn = round.guesses[round.turn]

	for (let team in turn) {
		let guess = turn[team]
		let category = null

		for (let i = 0; i < round.board.length; i++) {
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

function calculateTurnPoints() {
	// if a guess is correct, the points get split between all teams that guessed that category correctly.

	findGuessCategories()

	let round = game.rounds[game.round]
	let turn = round.guesses[round.turn]
	let correctCategories = {}

	for (let team in turn) {
		let guess = turn[team]

		if (guess.correct) {
			if (!correctCategories[guess.category]) correctCategories[guess.category] = []
			correctCategories[guess.category].push(team)
		}
	}

	let teamPoints = {}

	for (let category in correctCategories) {
		let points = game.categoryPoints[category]
		let teams = correctCategories[category]

		for (let team of teams) {
			teamPoints[team] = Math.round(points / teams.length)
		}
	}

	for (let team in turn) {
		turn[team].points = teamPoints[team] || 0
	}

	return teamPoints
}

function applyTurnPoints() {
	calculateTurnPoints()

	let round = game.rounds[game.round]
	let turn = round.guesses[round.turn]

	for (let team in turn) {
		teams[team].score += turn[team].points
	}
}

server.listen(3040, () => console.log("Server running on port 3040"))
