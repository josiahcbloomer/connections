let socket = io()

let roundInput = document.querySelector("input#round")

let guessesContainer = document.querySelector(".guesses")

let categoryColors = "yellow.green.blue.purple".split(".")

socket.on("update-game", ({game, teams}) => {
    roundInput.value = (game.round + 1)

    let round = game.rounds[game.round]

    guessesContainer.innerHTML = ""
    for(let i in round.guesses) {
        let guess = round.guesses[i]

        if (!teams[i]) continue

        let guessElement = document.createElement("div")
        guessElement.classList.add("guess")
        guessElement.dataset.team = i

        let guessTeam = document.createElement("h3")
        guessTeam.textContent = `Team ${teams[i].name}`
        guessElement.append(guessTeam)

        let guessWords = document.createElement("p")
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
        guessCategory.textContent = `Category: ${guess.guess === null ? "None" : guess.guess}`
        guessElement.append(guessCategory)

        let guessCorrect = document.createElement("input")
        guessCorrect.type = "checkbox"
        guessCorrect.checked = guess.correct
        guessCorrect.addEventListener("change", () => {
            socket.emit("update-guess-correct", {
                team: i,
                correct: guessCorrect.checked
            })
        })
        guessElement.append(guessCorrect)

        let guessPoints = document.createElement("p")
        guessPoints.textContent = `Points from this round: ${guess.points}`
        guessElement.append(guessPoints)

        guessesContainer.append(guessElement)
    }
})