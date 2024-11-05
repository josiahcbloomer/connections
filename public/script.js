let socket = io()

let boardContainer = document.querySelector(".board")

let categoryColors = "yellow.green.blue.purple".split(".")

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
        tileElement.textContent = tile

        tileElement.classList.toggle("selected", selectedTiles.includes(tile))

        tileElement.addEventListener("click", () => {
            tileElement.classList.toggle("selected")
            if (getSelectedTiles().length > 4) {
                tileElement.classList.remove("selected")
            }
        })

        boardContainer.append(tileElement)
    })
}

function getSelectedTiles() {
    let tiles = boardContainer.querySelectorAll(".tile")
    let selectedTiles = Array.from(tiles).filter(tile => tile.classList.contains("selected"))

    return selectedTiles.map(tile => tile.textContent)
}

socket.on("update-board", ({ revealed, scrambled }) => {
    renderBoard({ revealed, scrambled })
})