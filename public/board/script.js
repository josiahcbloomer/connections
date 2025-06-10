let socket = io()

let mainGame = document.querySelector(".main.game")
let mainWait = document.querySelector(".main.wait")

let boardContainer = document.querySelector(".board")
let scoresTable = document.querySelector(".scores table")

let categoryColors = "yellow.green.blue.purple".split(".")

function renderBoard({ revealed, scrambled }) {
    boardContainer.innerHTML = ""
    revealed.forEach(category => {
        let categoryElement = document.createElement("div")
        categoryElement.classList.add("category")
        categoryElement.classList.add(categoryColors[category.color])

        let container = document.createElement("div")

        let title = document.createElement("h3")
        title.textContent = category.description

        let words = document.createElement("p")
        words.textContent = category.words.join(", ")

        container.append(title, words)
        categoryElement.append(container)

        boardContainer.append(categoryElement)
    })
    scrambled.forEach(tile => {
        let tileElement = document.createElement("div")
        tileElement.classList.add("tile")
        tileElement.dataset.word = tile
        tileElement.textContent = tile

        boardContainer.append(tileElement)
    })
}

function renderScores({ game, teams }) {
    scoresTable.innerHTML = `<tr><th>Team</th><th>Score</th><th>Guess In?</th></tr>`
    for(let team in teams) {
        let row = document.createElement("tr")
        let name = document.createElement("td")
        let score = document.createElement("td")
        let guess = document.createElement("td")

        if (!teams[team].connected) continue

        let round = game.rounds[game.round]
        let turn = round.guesses[round.turn]

        name.textContent = teams[team].name
        score.textContent = teams[team].score
        guess.textContent = turn[team] ? "Yes" : "No"

        row.append(name, score, guess)
        scoresTable.append(row)
    }
}

socket.on("update-board", ({ revealed, scrambled }) => {
    renderBoard({ revealed, scrambled })
})

socket.on("update-game", ({ game, teams }) => {
    console.log(teams)
    renderScores({ game, teams })

    mainGame.classList.toggle("active", game.round >= 0)
    mainWait.classList.toggle("active", game.round < 0)
})