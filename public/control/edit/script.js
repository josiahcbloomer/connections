let boardContainer = document.querySelector(".board")
let roundsContainer = document.querySelector(".rounds-list")
let addRoundButton = document.querySelector(".add-round")

let selectedRound = 0

let boardSort = new Sortable(boardContainer, {
	handle: ".handle",
	animation: 200,
	easing: "cubic-bezier(1, 0, 0, 1)",
	ghostClass: "ghost",
	dragClass: "drag",
	chosenClass: "chosen",
    onEnd: saveBoard,
})

let dummyData = [
	["Interns", "Dawson, Micaiah, Jonah, Geraldo"],
	["Things That Fly", "Birds, Planes, Dawson, Flies"],
	["Yellow Songs", "Yellow, Yellow Submarine, Yellow Brick Road, Yo"],
	["Bing Bong", "Bong, Shong, Zhong, mmmmmmm"],
	["What", "does, the, fox, say"],
	["Colors", "Red, Blue, Green, Yellow"],
	["Fruits", "Apple, Banana, Orange, Grape"],
	["Tall Things", "Tree, Building, Giraffe, Tower"],
	["Short Things", "Ant, Mouse, Bug, Pebble"],
]

addRoundButton.addEventListener("click", async () => {
	let { game } = await fetch("/api/round", { method: "POST" }).then(res => res.json())

	renderBoard(game.rounds[game.round].board)
	renderRounds(game.rounds)
})

function renderRounds(rounds) {
	roundsContainer.innerHTML = ""

	rounds.forEach((round, index) => {
		let roundElement = document.createElement("div")
		roundElement.classList.add("round")

        let roundP = document.createElement("p")
        roundP.textContent = `Round ${index + 1}`

        let upButton = document.createElement("button")
        upButton.textContent = "↑"
        upButton.addEventListener("click", async () => {
            if (index == 0) return console.log("nooo up")
            let { game } = await fetch(`/api/rounds/${index}/move/up`, { method: "PUT" }).then(res => res.json())
            
            selectedRound --
            
            renderRounds(game.rounds)
        })

        let downButton = document.createElement("button")
        downButton.textContent = "↓"
        downButton.addEventListener("click", async () => {
            if (index == rounds.length - 1) return console.log("nooo down")
            let { game } = await fetch(`/api/rounds/${index}/move/down`, { method: "PUT" }).then(res => res.json())
            
            selectedRound ++

            renderRounds(game.rounds)
        })

        let deleteButton = document.createElement("button")
        deleteButton.textContent = "🗑️"
        deleteButton.addEventListener("click", async () => {
            if (rounds.length == 1) return
            if (!confirm("Delete round?")) return

            let { game } = await fetch(`/api/rounds/${index}`, { method: "DELETE" }).then(res => res.json())
            
            selectedRound = 0

            renderRounds(game.rounds)
        })

        roundElement.append(roundP, upButton, downButton, deleteButton)

		if (selectedRound == index) roundElement.classList.add("selected")
		roundElement.addEventListener("click", () => {
			selectedRound = index
			roundsContainer.querySelectorAll(".round").forEach(round => round.classList.remove("selected"))
			roundElement.classList.add("selected")

            loadGame()
		})

		roundsContainer.append(roundElement)
	})
}

function renderBoard(board) {
	boardContainer.innerHTML = ""

	board.forEach(row => {
		let dummy = dummyData[Math.floor(Math.random() * dummyData.length)]

		let rowElement = document.createElement("div")
		rowElement.classList.add("row")

		let handle = document.createElement("span")
		handle.classList.add("handle")
		handle.innerHTML = "☰"
		rowElement.append(handle)

		let categoryLabel = document.createElement("label")
		categoryLabel.textContent = "Category:"
		rowElement.append(categoryLabel)

		let categoryInput = document.createElement("input")
		categoryInput.value = row.description
		categoryInput.type = "text"
		categoryInput.classList.add("category")
		categoryInput.placeholder = dummy[0]
		rowElement.append(categoryInput)
        categoryInput.addEventListener("change", saveBoard)

		let wordLabel = document.createElement("label")
		wordLabel.textContent = "Words:"
		rowElement.append(wordLabel)

		let wordInput = document.createElement("input")
		wordInput.value = row.words.join(", ")
		wordInput.type = "text"
		wordInput.classList.add("words")
		wordInput.placeholder = dummy[1]
		rowElement.append(wordInput)
		wordInput.addEventListener("change", saveBoard)

		boardContainer.append(rowElement)
	})
}

function getBoard() {
	let rows = boardContainer.querySelectorAll(".row")
	let board = []

	rows.forEach(r => {
		let category = r.querySelector(".category").value
		let words = r
			.querySelector(".words")
			.value.split(",")
			.map(w => w.trim().toUpperCase())
		board.push({ description: category, words: words.slice(0, 4), revealed: false })
	})

	return board
}

async function saveBoard() {
	let newBoard = getBoard()
    console.log("saving")
	await fetch(`/api/rounds/${selectedRound}/board`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ board: newBoard }),
	})
}

async function loadGame() {
	let { game } = await fetch("/api/game").then(res => res.json())

	renderBoard(game.rounds[selectedRound].board)
	renderRounds(game.rounds)
}

loadGame()
