(() => {
    "use strict";

    const STORAGE_KEY = "samarth-sudoku-game";
    const DIFFICULTY_COOKIE = "samarth-sudoku-difficulty";
    const BLANKS_BY_DIFFICULTY = {
        easy: 38,
        medium: 46,
        hard: 52
    };

    const boardElement = document.querySelector("#sudoku-board");
    const timerElement = document.querySelector("#timer");
    const messageElement = document.querySelector("#game-message");
    const difficultyElement = document.querySelector("#difficulty");
    const newGameButton = document.querySelector("#new-game");
    const resetButton = document.querySelector("#reset-puzzle");
    const clearButton = document.querySelector("#clear-cell");
    const notesButton = document.querySelector("#notes-toggle");
    const numberButtons = document.querySelectorAll("[data-number]");

    let game = null;
    let selectedCell = null;
    let pencilMode = false;
    let timerId = null;

    function shuffled(values) {
        const result = [...values];

        for (let index = result.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [result[index], result[randomIndex]] = [
                result[randomIndex],
                result[index]
            ];
        }

        return result;
    }

    function getRow(index) {
        return Math.floor(index / 9);
    }

    function getColumn(index) {
        return index % 9;
    }

    function getBox(index) {
        return Math.floor(getRow(index) / 3) * 3 + Math.floor(getColumn(index) / 3);
    }

    function getCandidates(board, index) {
        if (board[index] !== 0) {
            return [];
        }

        const used = new Set();
        const row = getRow(index);
        const column = getColumn(index);
        const boxStartRow = Math.floor(row / 3) * 3;
        const boxStartColumn = Math.floor(column / 3) * 3;

        for (let offset = 0; offset < 9; offset += 1) {
            used.add(board[row * 9 + offset]);
            used.add(board[offset * 9 + column]);
        }

        for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
            for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
                used.add(board[(boxStartRow + rowOffset) * 9 + boxStartColumn + columnOffset]);
            }
        }

        return shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9]).filter((number) => !used.has(number));
    }

    function fillBoard(board) {
        let target = -1;
        let candidates = null;

        for (let index = 0; index < 81; index += 1) {
            if (board[index] === 0) {
                const options = getCandidates(board, index);

                if (options.length === 0) {
                    return false;
                }

                if (candidates === null || options.length < candidates.length) {
                    target = index;
                    candidates = options;

                    if (options.length === 1) {
                        break;
                    }
                }
            }
        }

        if (target === -1) {
            return true;
        }

        for (const number of candidates) {
            board[target] = number;

            if (fillBoard(board)) {
                return true;
            }
        }

        board[target] = 0;
        return false;
    }

    function countSolutions(board, limit = 2) {
        let target = -1;
        let candidates = null;

        for (let index = 0; index < 81; index += 1) {
            if (board[index] === 0) {
                const options = getCandidates(board, index);

                if (options.length === 0) {
                    return 0;
                }

                if (candidates === null || options.length < candidates.length) {
                    target = index;
                    candidates = options;
                }
            }
        }

        if (target === -1) {
            return 1;
        }

        let total = 0;

        for (const number of candidates) {
            board[target] = number;
            total += countSolutions(board, limit - total);

            if (total >= limit) {
                break;
            }
        }

        board[target] = 0;
        return total;
    }

    function createPuzzle(difficulty) {
        const solution = Array(81).fill(0);
        fillBoard(solution);

        const puzzle = [...solution];
        const positions = shuffled(Array.from({ length: 81 }, (_, index) => index));
        let removed = 0;

        for (const position of positions) {
            if (removed >= BLANKS_BY_DIFFICULTY[difficulty]) {
                break;
            }

            const savedValue = puzzle[position];
            puzzle[position] = 0;

            if (countSolutions([...puzzle]) === 1) {
                removed += 1;
            } else {
                puzzle[position] = savedValue;
            }
        }

        return { puzzle, solution };
    }

    function getCookie(name) {
        try {
            const prefix = `${name}=`;
            const cookie = document.cookie.split(";").map((part) => part.trim())
                .find((part) => part.startsWith(prefix));

            return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
        } catch (error) {
            return null;
        }
    }

    function setDifficultyCookie(difficulty) {
        try {
            document.cookie = `${DIFFICULTY_COOKIE}=${encodeURIComponent(difficulty)}; max-age=31536000; path=/; SameSite=Lax`;
        } catch (error) {
            // Cookie storage is optional; the game remains playable without it.
        }
    }

    function saveGame() {
        if (!game) {
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
        } catch (error) {
            // Storage can be disabled or full; keep the in-memory game running.
        }
    }

    function isValidGame(savedGame) {
        return savedGame &&
            ["easy", "medium", "hard"].includes(savedGame.difficulty) &&
            Array.isArray(savedGame.puzzle) && savedGame.puzzle.length === 81 &&
            Array.isArray(savedGame.solution) && savedGame.solution.length === 81 &&
            Array.isArray(savedGame.entries) && savedGame.entries.length === 81 &&
            Array.isArray(savedGame.notes) && savedGame.notes.length === 81 &&
            Number.isFinite(savedGame.elapsed) &&
            ["active", "completed"].includes(savedGame.status);
    }

    function loadGame() {
        try {
            const savedGame = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return isValidGame(savedGame) ? savedGame : null;
        } catch (error) {
            return null;
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
        const remainder = (seconds % 60).toString().padStart(2, "0");
        return `${minutes}:${remainder}`;
    }

    function updateTimer() {
        timerElement.textContent = formatTime(game.elapsed);
    }

    function startTimer() {
        window.clearInterval(timerId);

        if (game.status !== "active") {
            return;
        }

        timerId = window.setInterval(() => {
            game.elapsed += 1;
            updateTimer();
            saveGame();
        }, 1000);
    }

    function getCellValue(index) {
        return game.puzzle[index] || game.entries[index];
    }

    function isIncorrect(index) {
        return game.entries[index] !== 0 && game.entries[index] !== game.solution[index];
    }

    function renderBoard() {
        const fragment = document.createDocumentFragment();
        const selectedValue = selectedCell === null ? 0 : getCellValue(selectedCell);

        for (let index = 0; index < 81; index += 1) {
            const button = document.createElement("button");
            const isGiven = game.puzzle[index] !== 0;
            const value = getCellValue(index);
            const isRelated = selectedCell !== null && (
                getRow(index) === getRow(selectedCell) ||
                getColumn(index) === getColumn(selectedCell) ||
                getBox(index) === getBox(selectedCell)
            );

            button.type = "button";
            button.className = "sudoku-cell";
            button.dataset.index = index;
            button.setAttribute("role", "gridcell");
            button.setAttribute("aria-label", `Row ${getRow(index) + 1}, column ${getColumn(index) + 1}${value ? `, ${value}` : ", empty"}`);

            if (isGiven) {
                button.classList.add("given");
                button.setAttribute("aria-readonly", "true");
            }

            if (isRelated) {
                button.classList.add("related");
            }

            if (selectedCell === index) {
                button.classList.add("selected");
                button.setAttribute("aria-selected", "true");
            }

            if (selectedValue && value === selectedValue) {
                button.classList.add("matching");
            }

            if (isIncorrect(index)) {
                button.classList.add("incorrect");
            }

            if (value) {
                button.textContent = value;
            } else if (game.notes[index].length) {
                const notes = document.createElement("span");
                notes.className = "sudoku-notes";
                notes.setAttribute("aria-label", `Notes: ${game.notes[index].join(", ")}`);

                for (let number = 1; number <= 9; number += 1) {
                    const note = document.createElement("span");
                    note.className = "sudoku-note";
                    note.textContent = game.notes[index].includes(number) ? number : "";
                    notes.appendChild(note);
                }

                button.appendChild(notes);
            }

            fragment.appendChild(button);
        }

        boardElement.replaceChildren(fragment);
    }

    function setMessage(message, completed = false) {
        messageElement.textContent = message;
        messageElement.classList.toggle("complete", completed);
    }

    function render() {
        difficultyElement.value = game.difficulty;
        updateTimer();
        renderBoard();
    }

    function createNewGame(difficulty) {
        const previousPuzzle = game ? game.puzzle.join("") : "";
        let generated;

        do {
            generated = createPuzzle(difficulty);
        } while (generated.puzzle.join("") === previousPuzzle);

        game = {
            ...generated,
            entries: Array(81).fill(0),
            notes: Array.from({ length: 81 }, () => []),
            difficulty,
            elapsed: 0,
            status: "active"
        };

        selectedCell = null;
        pencilMode = false;
        notesButton.setAttribute("aria-pressed", "false");
        notesButton.textContent = "Pencil mode: Off";
        notesButton.classList.remove("notes-active");
        setDifficultyCookie(difficulty);
        setMessage("New puzzle ready. Select an empty square to begin.");
        render();
        saveGame();
        startTimer();
    }

    function selectCell(index) {
        selectedCell = index;

        if (game.puzzle[index]) {
            setMessage("That is an original puzzle clue and cannot be changed.");
        } else if (game.status === "completed") {
            setMessage("This puzzle is complete. Start a new game whenever you are ready.", true);
        } else {
            setMessage(pencilMode ? "Pencil mode is on. Choose a number to add or remove a note." : "Choose a number to enter it in the selected square.");
        }

        renderBoard();
    }

    function checkCompletion() {
        const complete = game.entries.every((entry, index) => game.puzzle[index] || entry === game.solution[index]);

        if (complete) {
            game.status = "completed";
            window.clearInterval(timerId);
            setMessage(`Puzzle complete in ${formatTime(game.elapsed)}. Great work!`, true);
            return true;
        }

        return false;
    }

    function enterNumber(number) {
        if (selectedCell === null) {
            setMessage("Select an empty square first.");
            return;
        }

        if (game.status === "completed") {
            setMessage("This puzzle is complete. Start a new game whenever you are ready.", true);
            return;
        }

        if (game.puzzle[selectedCell]) {
            setMessage("Original puzzle clues cannot be changed.");
            return;
        }

        if (pencilMode) {
            const notes = game.notes[selectedCell];
            const noteIndex = notes.indexOf(number);

            game.entries[selectedCell] = 0;

            if (noteIndex === -1) {
                notes.push(number);
                notes.sort((first, second) => first - second);
            } else {
                notes.splice(noteIndex, 1);
            }

            setMessage(`Note ${number} ${noteIndex === -1 ? "added" : "removed"}.`);
        } else {
            game.entries[selectedCell] = number;
            game.notes[selectedCell] = [];

            if (isIncorrect(selectedCell)) {
                setMessage("That number is incorrect. Try another one.");
            } else {
                setMessage("Nice move.");
            }

            checkCompletion();
        }

        render();
        saveGame();
    }

    function clearSelectedCell() {
        if (selectedCell === null) {
            setMessage("Select an empty square first.");
            return;
        }

        if (game.puzzle[selectedCell]) {
            setMessage("Original puzzle clues cannot be changed.");
            return;
        }

        if (game.status === "completed") {
            setMessage("This puzzle is complete. Start a new game whenever you are ready.", true);
            return;
        }

        game.entries[selectedCell] = 0;
        game.notes[selectedCell] = [];
        setMessage("Selected square cleared.");
        render();
        saveGame();
    }

    function resetPuzzle() {
        game.entries = Array(81).fill(0);
        game.notes = Array.from({ length: 81 }, () => []);
        game.elapsed = 0;
        game.status = "active";
        selectedCell = null;
        setMessage("Puzzle reset. Your original clues are still in place.");
        render();
        saveGame();
        startTimer();
    }

    function togglePencilMode() {
        pencilMode = !pencilMode;
        notesButton.setAttribute("aria-pressed", String(pencilMode));
        notesButton.textContent = `Pencil mode: ${pencilMode ? "On" : "Off"}`;
        notesButton.classList.toggle("notes-active", pencilMode);
        setMessage(pencilMode ? "Pencil mode is on." : "Pencil mode is off.");
    }

    function handleKeydown(event) {
        if (event.target.matches("select")) {
            return;
        }

        if (/^[1-9]$/.test(event.key)) {
            event.preventDefault();
            enterNumber(Number(event.key));
        } else if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault();
            clearSelectedCell();
        } else if (event.key.toLowerCase() === "p") {
            event.preventDefault();
            togglePencilMode();
        }
    }

    boardElement.addEventListener("click", (event) => {
        const cell = event.target.closest(".sudoku-cell");

        if (cell) {
            selectCell(Number(cell.dataset.index));
        }
    });

    numberButtons.forEach((button) => {
        button.addEventListener("click", () => enterNumber(Number(button.dataset.number)));
    });

    newGameButton.addEventListener("click", () => createNewGame(difficultyElement.value));
    resetButton.addEventListener("click", resetPuzzle);
    clearButton.addEventListener("click", clearSelectedCell);
    notesButton.addEventListener("click", togglePencilMode);

    difficultyElement.addEventListener("change", () => {
        setDifficultyCookie(difficultyElement.value);
        createNewGame(difficultyElement.value);
    });

    document.addEventListener("keydown", handleKeydown);

    const savedGame = loadGame();

    if (savedGame) {
        game = savedGame;
        setMessage(game.status === "completed" ? `Puzzle complete in ${formatTime(game.elapsed)}. Great work!` : "Your saved puzzle has been restored.", game.status === "completed");
        render();
        startTimer();
    } else {
        const savedDifficulty = getCookie(DIFFICULTY_COOKIE);
        createNewGame(BLANKS_BY_DIFFICULTY[savedDifficulty] ? savedDifficulty : "easy");
    }
})();
