let socket = io()

let categoryColors = "yellow.green.blue.purple".split(".")
let currentRound = -1
let hasAssignedPoints = false

let teamsList = document.querySelector(".teams-list")
let pointsContainer = document.querySelector(".points-control")
let categoriesContainer = document.querySelector(".categories")

let scrambleButton = document.querySelector("button.scramble")
let nextButton = document.querySelector("button.next-button")
let resetButton = document.querySelector("button.reset")
let refreshButton = document.querySelector("button.refresh-button")
let splitPointsInput = document.querySelector(".split-points-checkbox")
let pointsButton = document.querySelector(".points-button")

let roundNum = document.querySelector(".round-num")
let turnNum = document.querySelector(".turn-num")

socket.on("update-game", ({ game, teams }) => {
	currentRound = game.round

    roundNum.textContent = game.round + 1

    turnNum.textContent = "0"

    splitPointsInput.checked = game.splitPointsMode

    hasAssignedPoints = false
    nextButton.disabled = false

    if (game.round >= 0) {
		turnNum.textContent = game.rounds[game.round].turn + 1

        let round = game.rounds[game.round]

        let categoriesRevealed = 0
		for (let category of round.board) {
			if (category.revealed) categoriesRevealed++
		}

        console.log("points assigned:", round.pointsAssigned)
        hasAssignedPoints = round.pointsAssigned
        pointsButton.disabled = false
        pointsButton.textContent = hasAssignedPoints ? "Unassign Points" : "Assign Points"
        nextButton.disabled = !hasAssignedPoints

        nextButton.textContent = categoriesRevealed >= 4 ? "Next Round" : "Next Turn"

        renderCategories(round.board)
        renderPoints(game.categoryPoints)
	    renderTeams(game, teams)
    } else {
	    renderTeams(game, teams)
        renderPoints(game.categoryPoints)
        nextButton.textContent = "Show First Round"
        categoriesContainer.innerHTML = ""
    }
})

function renderTeams(game, teams) {
	teamsList.innerHTML = ""

	for (let team in teams) {
		let teamElement = document.createElement("div")
		teamElement.classList.add("team")
		teamElement.dataset.id = teams[team].id

		let teamName = document.createElement("input")
        teamName.type = "text"
		teamName.classList.add("team-name", "input-subtle")
        teamName.placeholder = "Team Name"
		teamName.value = teams[team].name
        teamName.addEventListener("change", () => {
            socket.emit("update-team-name", {
                team,
                name: teamName.value,
            })
        })
		teamElement.appendChild(teamName)

		let teamScore = document.createElement("input")
		teamScore.type = "number"
		teamScore.value = teams[team].score
		teamScore.classList.add("team-score")
        teamScore.addEventListener("change", () => {
            socket.emit("update-team-score", {
                team,
                score: parseInt(teamScore.value) || 0,
            })
        })
		teamElement.appendChild(teamScore)

		let removeTeamButton = document.createElement("a")
		removeTeamButton.classList.add("remove-team")
		removeTeamButton.textContent = "x"
		removeTeamButton.href = "javscript:void(0)"
		removeTeamButton.addEventListener("click", () => {
            if (!confirm(`Are you sure you want to remove team ${team}?`)) return
            socket.emit("remove-team", team)
        })
		teamElement.appendChild(removeTeamButton)

		if (teams[team].connected) {
			if (game.round >= 0) {
				let round = game.rounds[game.round]
				let turn = round.guesses[round.turn]

				// if the team has begun to guess
				if (turn[team]) {
					let guess = turn[team]

					let teamGuessContainer = document.createElement("div")
					teamGuessContainer.classList.add("guess-container")
					teamGuessContainer.classList.toggle("not-submitted", !guess.submitted)

					let guessWords = document.createElement("div")
					guessWords.classList.add("guess-words")

					for (let word of guess.words) {
						let wordCategory = round.board.findIndex(category => category.words.includes(word))
						let wordColor = categoryColors[wordCategory]

						let wordElement = document.createElement("span")
						wordElement.classList.add("guess-word", wordColor)
						wordElement.textContent = word
						guessWords.appendChild(wordElement)
					}

					teamGuessContainer.appendChild(guessWords)

					let guessText = document.createElement("p")
					guessText.classList.add("guess-text")
					guessText.textContent = guess.guess.toUpperCase() ?? ""
					teamGuessContainer.appendChild(guessText)

					let guessInfo = document.createElement("p")
					guessInfo.classList.add("guess-info")
					guessInfo.textContent = `Correct Category: ${
						guess.category && round.board[guess.category].description.toUpperCase()
					}`
					console.log(guess.category)
					if (guess.category) teamGuessContainer.appendChild(guessInfo)

					teamElement.appendChild(teamGuessContainer)

					if (guess.submitted) {
						let correctContainer = document.createElement("div")
						correctContainer.classList.add("correct-container")

                        console.log("hello", hasAssignedPoints)

						let correctLabel = document.createElement("label")
						correctLabel.textContent = "Correct: "
						let guessCorrect = document.createElement("input")
						guessCorrect.type = "checkbox"
						guessCorrect.checked = guess.correct
						guessCorrect.disabled = (!guess.category) || hasAssignedPoints // if their guess is invalid, disable
						guessCorrect.addEventListener("change", () => {
                            console.log(team, guessCorrect.checked)
							socket.emit("update-guess-correct", {
								team,
								correct: guessCorrect.checked,
							})
						})
						correctLabel.appendChild(guessCorrect)

                        let pointsText = document.createElement("span")
                        pointsText.textContent = ` (${guess.points} points)`
                        correctLabel.appendChild(pointsText)
						correctContainer.appendChild(correctLabel)
                        teamElement.appendChild(correctContainer)

                        let actionsContainer = document.createElement("div")
                        actionsContainer.classList.add("actions-container")

						let unsubmitButton = document.createElement("button")
						unsubmitButton.classList.add("unsubmit-button", "red")
						unsubmitButton.textContent = "Unsubmit"
                        unsubmitButton.disabled = hasAssignedPoints
						unsubmitButton.addEventListener("click", () => {
							socket.emit("unsubmit-guess", team)
						})
						actionsContainer.appendChild(unsubmitButton)
						teamElement.appendChild(actionsContainer)
					}
				}
			}
		} else {
			let disconnectedLabel = document.createElement("span")
			disconnectedLabel.classList.add("disconnected")
			disconnectedLabel.textContent = "Disconnected"
			teamElement.appendChild(disconnectedLabel)
		}

		teamsList.appendChild(teamElement)
	}
}

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
        pointsInput.disabled = hasAssignedPoints
		pointsInput.addEventListener("change", () => {
			fetch("/api/category-points", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					category: i,
					points: parseInt(pointsInput.value),
				}),
			})
		})
		pointsDiv.append(pointsLabel, pointsInput)
		pointsContainer.append(pointsDiv)
	})
}

function renderCategories(board) {
	categoriesContainer.innerHTML = ""

	for (let category of board) {
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
				category: board.indexOf(category),
			})
		})

		rightContainer.append(revealButton)

		categoryElement.append(leftContainer, rightContainer)

		categoriesContainer.append(categoryElement)
	}
}

resetButton.addEventListener("click", () => {
	if (!confirm("Are you sure you want to reset the game?")) return
	socket.emit("reset")
})

scrambleButton.addEventListener("click", () => {
	socket.emit("scramble-board")
})

refreshButton.addEventListener("click", () => {
	socket.emit("refresh")
})

pointsButton.addEventListener("click", () => socket.emit("assign-points"))

nextButton.addEventListener("click", () => socket.emit("next"))

splitPointsInput.addEventListener("change", () => {
	fetch("/api/split-points-mode", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ splitPointsMode: splitPointsInput.checked }),
	})
})