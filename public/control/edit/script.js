let boardContainer = document.querySelector('.board')

let boardSort = new Sortable(boardContainer, {
    handle: ".handle",
    animation: 300,
	easing: "cubic-bezier(1, 0, 0, 1)",
    ghostClass: "ghost",
    dragClass: "drag",
    chosenClass: "chosen",
})

let dummyData = [
    ["Interns", "Dawson, Micaiah, Jonah, Geraldo"],
    ["Things That Fly", "Birds, Planes, Dawson, Flies"],
    ["Yellow Songs", "Yellow, Yellow Submarine, Yellow Brick Road, Yo"],
    ["Bing Bong", "Bong, Shong, Zhong, mmmmmmm"],
    ["What", "does, the, fox, say"],
]

function renderBoard(board) {
    boardContainer.innerHTML = ""

    board.forEach(row => {
        let dummy = dummyData[Math.floor(Math.random() * dummyData.length)]

        let rowElement = document.createElement('div')
        rowElement.classList.add('row')

        let handle = document.createElement('span')
        handle.classList.add('handle')
        handle.innerHTML = "☰"
        rowElement.append(handle)

        let categoryLabel = document.createElement('label')
        categoryLabel.textContent = "Category:"
        rowElement.append(categoryLabel)

        let categoryInput = document.createElement('input')
        categoryInput.value = row.description
        categoryInput.type = "text"
        categoryInput.classList.add('category')
        categoryInput.placeholder = dummy[0]
        rowElement.append(categoryInput)

        let wordLabel = document.createElement('label')
        wordLabel.textContent = "Words:"
        rowElement.append(wordLabel)

        let wordInput = document.createElement('input')
        wordInput.value = row.words.join(', ')
        wordInput.type = "text"
        wordInput.classList.add('words')
        wordInput.placeholder = dummy[1]
        rowElement.append(wordInput)
        
        boardContainer.append(rowElement)
    })
}

async function loadGame() {
    let { game } = await fetch('/api/game').then(res => res.json())

    renderBoard(game.rounds[game.round].board)
}

loadGame()