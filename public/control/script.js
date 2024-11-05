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

        let guessElement = document.createElement("div")
        guessElement.classList.add("guess")
        guessElement.dataset.team = i

        let guessTeam = document.createElement("h3")
        console.log(teams, i)
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

        guessesContainer.append(guessElement)
    }
})