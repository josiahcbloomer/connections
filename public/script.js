let socket = io()

let currentRound = 0

let teamID
if (localStorage.getItem("teamID")) {
    teamID = localStorage.getItem("teamID")
    socket.emit("join-team", teamID)
    setPage("game")
} else {
    setPage("team")
}

let teamNameTitle = document.querySelector("h2.team-name")
let teamScoreText = document.querySelector("p.team-score")

let boardContainer = document.querySelector(".board")
let submitButton = document.querySelector(".submit-button")
let guessInput = document.querySelector(".guess-input")
let teamNameInput = document.querySelector(".team-input")
let teamNameSubmit = document.querySelector(".team-submit")

teamNameSubmit.addEventListener("click", () => {
    socket.emit("create-team", { name: teamNameInput.value })
})

submitButton.addEventListener("click", () => {
    if (submitButton.disabled) return
    if (!guessInput.value.length) return console.log("No guess provided")
    if (getSelectedTiles().length != 4) return console.log("You must select 4 tiles")

    socket.emit("submit-guess", {
        team: teamID,
        guess: guessInput.value,
        words: getSelectedTiles()
    })
})

let categoryColors = "yellow.green.blue.purple".split(".")

let allowSelections = true

function renderBoard({ revealed, scrambled }) {
    let selectedTiles = getSelectedTiles()

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

        tileElement.classList.toggle("selected", selectedTiles.includes(tile))

        tileElement.addEventListener("click", () => {
            if (!allowSelections) return
            tileElement.classList.toggle("selected")
            if (getSelectedTiles().length > 4) {
                tileElement.classList.remove("selected")
            }
        })

        boardContainer.append(tileElement)
    })
}

function setPage(page) {
    let pages = document.querySelectorAll(".page")
    pages.forEach(p => p.classList.toggle("active", p.dataset.page == page))
}

function getSelectedTiles() {
    let tiles = boardContainer.querySelectorAll(".tile")
    let selectedTiles = Array.from(tiles).filter(tile => tile.classList.contains("selected"))

    return selectedTiles.map(tile => tile.textContent)
}

socket.on("join-team", ({ id, team }) => {
    teamID = id
    teamNameTitle.textContent = `Team ${team.name}`
    localStorage.setItem("teamID", id)
    setPage("game")
})

socket.on("invalid-team", () => {
    localStorage.removeItem("teamID")
    setPage("team")
})

socket.on("update-board", ({ revealed, scrambled }) => {
    renderBoard({ revealed, scrambled })
})

socket.on("update-game", ({ game, teams }) => {
    if (game.round != currentRound) { // the round has changed
        currentRound = game.round
        guessInput.value = ""
    }

    teamScoreText.textContent = `Score: ${teams[teamID].score}`

    // if my team's guess has been submitted, disable the board
    let round = game.rounds[game.round]
    let turn = round.guesses[round.turn]
    let guess = turn[teamID]

    if (guess && guess.submitted) {
        guessInput.disabled = true
        submitButton.disabled = true
        allowSelections = false

        let tiles = boardContainer.querySelectorAll(".tile")
        tiles.forEach(tile => tile.classList.toggle("selected", guess.words.includes(tile.dataset.word)))
    } else {
        guessInput.disabled = false
        submitButton.disabled = false
        allowSelections = true
    }
})