let socket = io()

let scrambleButton = document.querySelector("button.scramble")
let nextButton = document.querySelector("button.next-button")
let resetButton = document.querySelector("button.reset")

let roundNum = document.querySelector(".round-num")
let turnNum = document.querySelector(".turn-num")

resetButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset the game?")) return
    socket.emit("reset")
})

scrambleButton.addEventListener("click", () => {
    socket.emit("scramble-board")
})

nextButton.addEventListener("click", () => {
    socket.emit("next")
})

let categoriesContainer = document.querySelector(".categories")
let guessesContainer = document.querySelector(".guesses")
let pointsContainer = document.querySelector(".points-control")
let splitPointsInput = document.querySelector(".split-points-checkbox")

splitPointsInput.addEventListener("change", () => {
    fetch("/api/split-points-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splitPointsMode: splitPointsInput.checked })
    })
})

let categoryColors = "yellow.green.blue.purple".split(".")

socket.on("update-game", ({game, teams}) => {
    roundNum.textContent = game.round + 1
    turnNum.textContent = game.rounds[game.round].turn + 1

    let round = game.rounds[game.round]

    let categoriesRevealed = 0
    for(let category of round.board) {
        if (category.revealed) categoriesRevealed++
    }

    nextButton.textContent = categoriesRevealed >= 4 ? "Next Round" : "Next Turn"

    splitPointsInput.checked = game.splitPointsMode

    renderGuesses(round, teams)
    renderCategories(round.board)
    renderPoints(game.categoryPoints)
})

function renderPoints(categoryPoints) {
    pointsContainer.innerHTML = ""
    categoryColors.forEach((color, i) => {
        let pointsDiv = document.createElement("div")
        pointsDiv.classList.add("point-control", color)
        
        let pointsLabel = document.createElement("label")
        pointsLabel.textContent = `${color.charAt(0).toUpperCase() + color.slice(1)}: `
        let pointsInput = document.createElement("input")
        pointsInput.type = "number"
        pointsInput.value = categoryPoints[i]
        pointsInput.addEventListener("change", () => {
            fetch("/api/category-points", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: i,
                    points: parseInt(pointsInput.value)
                })
            })
        })
        pointsDiv.append(pointsLabel, pointsInput)
        pointsContainer.append(pointsDiv)
    })
}

function renderGuesses(round, teams) {
    guessesContainer.innerHTML = ""
    let turn = round.guesses[round.turn]
    for(let i in turn) {
        let guess = turn[i]

        if (!teams[i]) continue

        let guessElement = document.createElement("div")
        guessElement.classList.add("guess")
        guessElement.dataset.team = i

        let guessDelete = document.createElement("button")
        guessDelete.classList.add("delete-button", "darker")
        guessDelete.textContent = "Delete"
        guessDelete.addEventListener("click", () => {
            socket.emit("delete-guess", i)
        })
        guessElement.append(guessDelete)

        let guessTeam = document.createElement("h3")
        guessTeam.textContent = `Team ${teams[i].name}`
        guessElement.append(guessTeam)

        let guessWords = document.createElement("p")
        guessWords.classList.add("words")
        for(let j = 0; j < guess.words.length; j++) {
            let wordCategory = round.board.findIndex(category => category.words.includes(guess.words[j]))
            let wordColor = categoryColors[wordCategory]

            let wordSpan = document.createElement("span")
            wordSpan.classList.add(wordColor)
            wordSpan.textContent = guess.words[j]

            guessWords.append(wordSpan)
        }
        guessElement.append(guessWords)

        let guessCategory = document.createElement("p")
        guessCategory.textContent = `Guess: "${guess.guess === null ? "None" : guess.guess.toUpperCase()}"`
        guessElement.append(guessCategory)

        let guessAnswer = document.createElement("p")
        guessAnswer.textContent = `Actual Category: ${guess.category === null ? "N/A" : round.board[guess.category].description}`
        guessElement.append(guessAnswer)

        let correctLabel = document.createElement("label")
        correctLabel.textContent = "Correct: "
        let guessCorrect = document.createElement("input")
        guessCorrect.type = "checkbox"
        guessCorrect.checked = guess.correct
        guessCorrect.disabled = guess.category === null // if their guess is invalid, disable
        guessCorrect.addEventListener("change", () => {
            socket.emit("update-guess-correct", {
                team: i,
                correct: guessCorrect.checked
            })
        })
        correctLabel.append(guessCorrect)
        guessElement.append(correctLabel)

        let guessPoints = document.createElement("p")
        guessPoints.textContent = `Points from this round: ${guess.points}`
        guessElement.append(guessPoints)

        guessesContainer.append(guessElement)
    }
}

function renderCategories(board) {
    categoriesContainer.innerHTML = ""

    for(let category of board) {
        let categoryElement = document.createElement("div")
        categoryElement.classList.add("category")
        categoryElement.classList.add(categoryColors[board.indexOf(category)])

        let leftContainer = document.createElement("div")
        leftContainer.classList.add("left")

        let title = document.createElement("h3")
        title.textContent = category.description

        let words = document.createElement("p")
        words.textContent = category.words.join(", ")

        leftContainer.append(title, words)

        let rightContainer = document.createElement("div")
        rightContainer.classList.add("right")

        let revealButton = document.createElement("button")
        revealButton.textContent = category.revealed ? "Hide" : "Reveal"
        revealButton.addEventListener("click", () => {
            socket.emit("reveal-category", {
                category: board.indexOf(category)
            })
        })

        rightContainer.append(revealButton)

        categoryElement.append(leftContainer, rightContainer)

        categoriesContainer.append(categoryElement)
    }
}