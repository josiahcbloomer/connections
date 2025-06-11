let socket = io()

let categoryColors = "yellow.green.blue.purple".split(".")
let currentRound = -1

let teamsList = document.querySelector(".teams-list")

socket.on("update-game", ({ game, teams }) => {
	currentRound = game.round

	renderTeams(game, teams)
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
		removeTeamButton.addEventListener("click", () => removeTeamFromGame(team))
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

						let correctLabel = document.createElement("label")
						correctLabel.textContent = "Correct: "
						let guessCorrect = document.createElement("input")
						guessCorrect.type = "checkbox"
						guessCorrect.checked = guess.correct
						guessCorrect.disabled = !guess.category // if their guess is invalid, disable
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
