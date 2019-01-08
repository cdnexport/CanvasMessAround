function Level(phrase) {
    this.phrase = phrase.toUpperCase();
    this.phraseMasked = phrase.replace(/[A-Z]/ig, '_');

    this.guesses = [];

    this.status = null;

    this.lives = 4;

    this.player = null;
}

Level.prototype.letterGuess = function(event, letter) {
    if (this.guesses.some((guess) => guess.letter === letter)) return;

    let letterIndexes = [];
    if (letters.some((letter) => letter.code === event.keyCode)) {
        let letterRegex = new RegExp(letter, "ig");
        if (!letterRegex.test(this.phrase)) {
            this.guesses.push({letter: letter, status: "failure"});
            this.removeLife();
        }
        else {
            for (let i = 0; i < this.phrase.length; i++) {
                if (this.phrase[i] === letter) {
                    letterIndexes.push(i);
                    this.guesses.push({letter: letter, status: "success"});
                }
            }

            this.phraseMasked = replaceLettersAt(letterIndexes, this.phraseMasked, letter);
            this.setWon();
        }
    }
}

Level.prototype.removeLife = function() {
    this.lives--;
    if (this.lives === 0) this.status = "lost";
}

function replaceLettersAt(indexes, string, replacement) {
    let newString = "";
    for (let i = 0; i < string.length; i++) {
        if (indexes.some((index) => index === i)) {
            newString += replacement;
        }
        else {
            newString += string[i];
        }
    }

    return newString;
}

Level.prototype.setWon = function() {
    if (!/_/ig.test(this.phraseMasked)) {
        this.status = "won";
    }
}

Level.prototype.isFinished = function() {
    return this.status != null;
}

var letters = [
    {code: 65, letter: "A"},
    {code: 66, letter: "B"},
    {code: 67, letter: "C"},
    {code: 68, letter: "D"},
    {code: 69, letter: "E"},
    {code: 70, letter: "F"},
    {code: 71, letter: "G"},
    {code: 72, letter: "H"},
    {code: 73, letter: "I"},
    {code: 74, letter: "J"},
    {code: 75, letter: "K"},
    {code: 76, letter: "L"},
    {code: 77, letter: "M"},
    {code: 78, letter: "N"},
    {code: 79, letter: "O"},
    {code: 80, letter: "P"},
    {code: 81, letter: "Q"},
    {code: 82, letter: "R"},
    {code: 83, letter: "S"},
    {code: 84, letter: "T"},
    {code: 85, letter: "U"},
    {code: 86, letter: "V"},
    {code: 87, letter: "W"},
    {code: 88, letter: "X"},
    {code: 89, letter: "Y"},
    {code: 90, letter: "Z"}
];

function runLevel(level, Display, andThen) {
    let gameContainer = document.createElement("div");
    gameContainer.className = "game";
    document.body.appendChild(gameContainer);

    let display = new Display(gameContainer, level);
    
    function keydownHandler(event) {
        level.letterGuess(event, event.key.toUpperCase());
        display.drawFrame();
        if (level.isFinished()) {
            display.clear();
            box.removeEventListener("keydown", keydownHandler); //to nuke the prior level out of this...

            if (andThen) {
                andThen(level.status);
            }
        }
    }
    box.addEventListener("keydown", keydownHandler);

    function selectedIndexChangedHandler() {
        level.player = document.getElementById("playerSelect").options[document.getElementById("playerSelect").selectedIndex].text;
        display.drawFrame();
    }
    playerDropdown.addEventListener("change", selectedIndexChangedHandler);
}

function runGame(Display) {
    let phrases = ["this phrase", "confederacy"];
    function startLevel(level) {
        runLevel(new Level(phrases[level]), Display, function(status) {
            //check status of the level ie win/lose
            if (status === "lost") {
                alert("You lost!");
                startLevel(0);
            } else if (level < phrases.length - 1) {
                startLevel(level + 1);
            } else {
                alert("You win!");
            }
        });
    }
    startLevel(0);
}

function Vector(x, y) {
	this.x = x;
	this.y = y;
}

//=============================================================
//Interface Creation
//=============================================================
var box = document.createElement("input");
box.type = "textbox";
box.className = "guess"
box.size = 1;

var playerDropdown = null;
(function() {
    playerDropdown = document.createElement("select");
    playerDropdown.id = "playerSelect";
    ["David", "Keni"].forEach((character) => {
        let opt = document.createElement("option");
        opt.innerHTML = character;
        playerDropdown.appendChild(opt);
    });
})();

//=============================================================
//CanvasDisplay
//=============================================================
var xPadding = 20;
function CanvasDisplay(parent, level) {
    this.canvas = document.createElement("canvas");
	this.canvas.width = 650;
	this.canvas.height = 650;
    parent.appendChild(this.canvas);

    this.cx = this.canvas.getContext("2d");

    this.box = box;
    parent.appendChild(this.box);
    this.box.focus();

    this.playerDropdown = playerDropdown;

    parent.appendChild(this.playerDropdown);

    this.level = level;
    this.level.player = document.getElementById("playerSelect").options[document.getElementById("playerSelect").selectedIndex].text;
	this.drawFrame(0);
}

CanvasDisplay.prototype.clear = function() {
    box.value = null;
    let grandpaNode = this.canvas.parentNode.parentNode;
    let siblings = [];
    grandpaNode.childNodes.forEach((child) => siblings.push(child));
    siblings.forEach((sibling) => grandpaNode.removeChild(sibling));
}

CanvasDisplay.prototype.drawFrame = function() {
    this.drawBackground();
    this.drawGuessLetters();
    this.drawGallows();
    this.drawPhrase();
    this.drawPlayer();
};

CanvasDisplay.prototype.drawPlayer = function() {
    let playerImage = new Image();
    playerImage.src = "img/characters/" + this.level.player + "/" + this.level.lives + ".png";
    let magicAdjustmentY = 20;
    playerImage.onload = () => {
        let hangingPointX = this.gallowsArmEnd.x - Math.round(playerImage.width / 2);
        let coordinates = null;
        if (this.level.lives === 4) {
            coordinates = new Vector(20, 100);
        } else {
            coordinates = new Vector(hangingPointX, this.gallowsArmEnd.y);
        }
        this.cx.drawImage(playerImage, coordinates.x, coordinates.y - magicAdjustmentY);
    }
}

var phraseStartY = 500;
CanvasDisplay.prototype.drawPhrase = function() {
    let nextLetterX = xStartPoint;
    let nextLetterY = phraseStartY;

    this.level.phraseMasked.split("").forEach((letter) => {
        this.drawText(nextLetterX, nextLetterY, letter, "black");
        nextLetterX = nextLetterX + letterSize + letterGap;
    });
}

var gallowsXStart = 200;
var gallowsYStart = 68;
var gallowsWidth = 350;
CanvasDisplay.prototype.drawGallows = function() {
    let lineJoinAdjustment = 2.5;
    //draw gallows bg
    this.cx.fillStyle = "white";
    this.cx.fillRect(gallowsXStart, gallowsYStart, gallowsWidth, gallowsWidth);

    this.cx.strokeStyle = "black";
    this.cx.lineWidth = lineJoinAdjustment * 2;
    this.cx.beginPath();
    //base
    this.cx.moveTo(gallowsXStart + 5, gallowsYStart + gallowsWidth - lineJoinAdjustment);
    this.cx.lineTo(gallowsXStart + 55, gallowsYStart + gallowsWidth - 50);
    this.cx.lineTo(gallowsXStart + 105, gallowsYStart + gallowsWidth - lineJoinAdjustment);

    //platform
    this.cx.moveTo(gallowsXStart + 55, gallowsYStart + gallowsWidth - 50);
    this.cx.lineTo(gallowsXStart + 200, gallowsYStart + gallowsWidth - 50);

    //stairs
    this.cx.moveTo(gallowsXStart + 200, gallowsYStart + gallowsWidth - 50 - lineJoinAdjustment);
    this.cx.lineTo(gallowsXStart + 200, gallowsYStart + gallowsWidth - 25);
    this.cx.lineTo(gallowsXStart + 225, gallowsYStart + gallowsWidth - 25);
    this.cx.lineTo(gallowsXStart + 225, gallowsYStart + gallowsWidth);

    //pole
    this.cx.moveTo(gallowsXStart + 55, gallowsYStart + gallowsWidth - 50);
    this.cx.lineTo(gallowsXStart + 55, gallowsYStart + gallowsWidth - 200);

    //arm
    this.cx.moveTo(gallowsXStart + 55 - lineJoinAdjustment, gallowsYStart + gallowsWidth - 200);
    this.cx.lineTo(gallowsXStart + 150, gallowsYStart + gallowsWidth - 200);
    this.cx.lineTo(gallowsXStart + 150, gallowsYStart + gallowsWidth - 150);
    this.gallowsArmEnd = new Vector(gallowsXStart + 150, gallowsYStart + gallowsWidth - 150);

    this.cx.stroke();
}

CanvasDisplay.prototype.drawBackground = function() {
    this.cx.fillStyle = "rgb(52, 166, 251)";
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

var letterGap = 3;
var letterSize = 32;
var xStartPoint = xPadding * 2;
CanvasDisplay.prototype.drawGuessLetters = function() {
    let guesses = this.level.guesses;
    let xSuccessDrawPoint = xStartPoint;
    let ySuccessDrawPoint = 100;
    let successRows = 0;
    let xFailureDrawPoint = xStartPoint;
    let yFailureDrawPoint = ySuccessDrawPoint + letterSize * 3;
    let failureRows = 0;

    guesses.forEach((guess) => {
        if (guess["status"] == "success") {
            if (xSuccessDrawPoint + letterSize + letterGap >= gallowsXStart) {
                successRows++;
                xSuccessDrawPoint = xStartPoint;
            }
            this.drawText(xSuccessDrawPoint, ySuccessDrawPoint + (successRows * letterSize), guess["letter"], "green");

            xSuccessDrawPoint += letterSize + letterGap;
        } else {
            if (xFailureDrawPoint + letterSize + letterGap >= gallowsXStart) {
                failureRows++;
                xFailureDrawPoint = xStartPoint;
            }
            this.drawText(xFailureDrawPoint, yFailureDrawPoint + (failureRows * letterSize), guess["letter"], "red");

            xFailureDrawPoint += letterSize + letterGap;
        }
    });
};

CanvasDisplay.prototype.drawText = function(x, y, text, color, font = letterSize + "pt serif") {
    this.cx.font = font;
    this.cx.fillStyle = color;
    this.cx.fillText(text, x, y);
}