let socket = io()

let roundInput = document.querySelector("input#round")

let guessesContainer = document.querySelector(".guesses")

socket.on("update-game", game => {
    roundInput.value = (game.round + 1)

    let round = game.rounds[game.round]

    for(let i in round.guesses) {
        let guess = round.guesses[i]

        let guessElement = document.createElement("div")
        guessElement.classList.add("guess")
        guessElement.dataset.team = i

        let guessTeam = document.createElement("h3")
        guessTeam.textContent = `Team ${i}`
        guessElement.append(guessTeam)
    }
})