/* 
 * COMP-397- :: Web Game Propgramming - Assignment #1
 *           
 * Name: Abdullah Akram Ansari
 * Student #: 300575913
 * 
 * Option Selected: Option 3
 * Notes: I had a lot of fun with this project.
 *
 *                                                   ***Gold Grab***
 *
 * Collect as much gold (Gold Squares) as you can while avoiding the enemy soldiers (Black Squares).
 *
 * Squares:
 * Player One: Red Square
 *
 * Controls:
 * WASD
 */

//Basic Shape
function Square(x, y) {
    this.y = y;
    this.x = x;
}

//Game Constants
var GAME_STARTED = false;
var SETUP_REQUIRED = true;
var GAME_SPEED = 30;      //ms
var GAME_WIDTH = 1000;
var GAME_HEIGHT = 500;
var GAME_TIMER = null;

var GOLD_REMAINING = 10;
var HIT_POINTS = 1;
var SCORE = 0;

var GOLD_LIST = null;
var SOLDIER_LIST = null;
var PLAYER = null;

var DIRECTION_LIST = [];  //Stores directions for soldiers.
var SOLDIER_SPEED = 5;    //px per iteration
var EDGE_LENGTH = 10;     //px, edge length of all squares in game
var CHANGE_CHANCE = 10;   //1 in CHANGE_CHANCE chance of moving in a different direction.

//What to add to the original's squares x & y to get co-ords for a new square in the associated direction - For Soldiers
var DIRECTION = { 'up' :   [0, (-1 * SOLDIER_SPEED)],
                  'down' : [0, SOLDIER_SPEED],
                  'left' : [(-1 * SOLDIER_SPEED), 0],
                  'right': [SOLDIER_SPEED, 0],
                  'stop' : [0, 0] };

var KEY_LIST = [];
var KEY = {
	W: 87,
    A: 65,
	S: 83,
    D: 68
}

$(function() {
    GAME_TIMER = setInterval(gameLoop, GAME_SPEED);
    
    $(document).keydown(function(e) {
		KEY_LIST[e.which] = true;
	});

	$(document).keyup(function(e) {
		KEY_LIST[e.which] = false;
	});
});

/*
 * GameLoop():
 * Initializes all DOM based game variables.
 * Will be called by the GAME_TIMER timer object.
 *
 */
function gameLoop() {
    if(!GAME_STARTED) {
        GOLD_LIST = $('.gold').get();
        PLAYER = ($('.player').get())[0];
        SOLDIER_LIST = $('.soldier').get();
        GAME_STARTED = true;
    }
    
    if(SETUP_REQUIRED) { 
        SETUP_REQUIRED = false;
        setupField();
    }
    
    updateField();
    movePlayer();
}

/*
 * MovePlayer():
 * Move player based on keys pressed. Player div is assigned new co-ordinates and a check is then performed.
 */
function movePlayer() {
    var playerSquare = getTempSquare(PLAYER);
    var destinationSquare = null;

    
    if(KEY_LIST[KEY.W])    { destinationSquare = getDestinationSquare(playerSquare.x, playerSquare.y, 'up'); }
    if(KEY_LIST[KEY.A])  { destinationSquare = getDestinationSquare(playerSquare.x, playerSquare.y, 'left'); }
    if(KEY_LIST[KEY.S])  { destinationSquare = getDestinationSquare(playerSquare.x, playerSquare.y, 'down'); }
    if(KEY_LIST[KEY.D]) { destinationSquare = getDestinationSquare(playerSquare.x, playerSquare.y, 'right'); }
    
    //short circuit evaluation
    if((destinationSquare != null) && isValidLocation(destinationSquare, false)) {
        setNewCoords(PLAYER, destinationSquare);
    }
    
    checkConditions();
}

/*
 * GetDestinationSquare(int x, int y, string direction):
 * Returns the square movement from the given x & y would result in the given direction.
 */
function getDestinationSquare(x, y, direction) {
    var theSquare = new Square(x + (DIRECTION[direction])[0], y + (DIRECTION[direction])[1]);
    return theSquare;
}

/*
 * CheckConditions()
 * Check whether a player has stepped on a soldier or gold square. Will perform game restart/reset under certain conditions. 
 */
function checkConditions() {
    var playerSquare = getTempSquare(PLAYER);
    
    //Set gold square to hidden when we first walk over it; hidden squares do not increment score when walked on
    for(var i = 0; i < GOLD_LIST.length; i++) {
        if(doesOverlap(getTempSquare(GOLD_LIST[i]), playerSquare)) {
            if($(GOLD_LIST[i]).css('visibility') == 'visible') {
                SCORE += 1;
                GOLD_REMAINING -= 1;
                
                $(GOLD_LIST[i]).css('visibility', 'hidden');
            }
        }
    }
    
    for(var j = 0; j < SOLDIER_LIST.length; j++) {
        if(doesOverlap(getTempSquare(SOLDIER_LIST[j]), playerSquare)) {
            HIT_POINTS -= 1;
        }
    }
    
    $('#currentScore').html(SCORE + ' ');
    if(parseInt($('#highScore').html()) < SCORE) {
        $('#highScore').html(SCORE.toString());
    }
    
    //Restart Game/Reset Map
    if(HIT_POINTS < 1 || GOLD_REMAINING < 1) {
        if(HIT_POINTS < 1) { SCORE = 0; }
        
        GOLD_REMAINING = 10;
        HIT_POINTS = 1;
        
        KEY_LIST[KEY.W] = false;
        KEY_LIST[KEY.A] = false;
        KEY_LIST[KEY.S] = false;
        KEY_LIST[KEY.D] = false;
        
        SETUP_REQUIRED = true;
    }
}

/*
 * UpdateField()
 * Update div values for soldiers for movement in the direction assigned, with a chance of assigning a new direction.
 */
function updateField() {
    var currentSoldier = null, tempDirection = '';
    
    for(var i = 0; i < SOLDIER_LIST.length; i++) {
        currentSoldier = SOLDIER_LIST[i];
        var destinationSquare = getDestinationSquare(parseInt($(currentSoldier).css('left')), parseInt($(currentSoldier).css('top')), DIRECTION_LIST[i]);
        
        if(isValidLocation(destinationSquare, true)) { setNewCoords(SOLDIER_LIST[i], destinationSquare); }
        
        if(Math.floor(Math.random() * CHANGE_CHANCE) == 0) {
            do {
                tempDirection = getRandomDirection();
            } while(tempDirection == DIRECTION_LIST[i]);
            
            DIRECTION_LIST[i] = tempDirection;
        }
    }
}

/*
 * SetupField():
 * Assign random values to all Gold, Player and Soldier Div's, and set all Gold Div's to visible.
 */
function setupField() {
    var theSquare = null;
    
    for(var i = 0; i < SOLDIER_LIST.length; i++) {
        DIRECTION_LIST.push(getRandomDirection());
        theSquare = getValidSpawnPoint(true);        
        setNewCoords(SOLDIER_LIST[i], theSquare);
    }
    
    for(var j = 0; j < GOLD_LIST.length; j++) {
        $(GOLD_LIST[j]).css('visibility', 'visible');
        theSquare = getValidSpawnPoint(true);
        setNewCoords(GOLD_LIST[j], theSquare);
    }
    
    theSquare = getValidSpawnPoint(true);
    setNewCoords(PLAYER, theSquare);
}

/*
 * GetRandomDirection():
 * Returns one of four new directions for movement for soldiers.
 * Small chance of stop movment command.
 */
function getRandomDirection() {
    var randomDirection = 'stop';
    
    switch(Math.floor(Math.random() * 4)) {
            case 0:
                randomDirection = 'up';
            break;
            
            case 1:
                randomDirection = 'down';
            break;
            
            case 2:
                randomDirection = 'left';
            break;
            
            case 3:
                randomDirection = 'right';
            break;
            break;
    }
    
    //Very small chance to stop
    randomDirection = (Math.floor(Math.random() * 25) == 1 ? 'stop' : randomDirection);
    
    return randomDirection;
}

/*
 * GetValidSpawnPoint(bool isSoldier):
 * Helper function for SetupField().
 */
function getValidSpawnPoint(isSoldier) {
    var theSquare = null, randX = -1, randY = -1;
    
    do {
            randX = Math.floor(Math.random() * (GAME_WIDTH - EDGE_LENGTH));
            randY = Math.floor(Math.random() * (GAME_WIDTH - EDGE_LENGTH));
            theSquare = new Square(randX, randY);
        } while(!isValidLocation(getDestinationSquare(randX, randY, 'stop'), isSoldier));
    
    return theSquare;
}

/*
 * SetNewCoords(JQuery Object[Element], Square newSquare)
 * Helper function for assigning top and left css style values to DOM objects
 */
function setNewCoords(origDiv, newSquare) {
    $(origDiv).css('left', newSquare.x.toString());
    $(origDiv).css('top', newSquare.y.toString());
}

/*
 * DoesOverlap(Square square1, Square square2):
 * The most important function in all of this code. Checks for overlap on the basis of vertice indexes being inside the other square for an overlap to occur.
 * Needs improvement for certain cases.
 */
function doesOverlap(square1, square2) {
    //Get vertices of both square
    var overlap = false;
    var square1_points = getVertices(square1);    
    var point, i;
    for(point = null, i = 0; i < square1_points.length; i++) {
        point = square1_points[i];
        if((square2.x <= point.x) && (point.x <= (square2.x + EDGE_LENGTH))) {
            if((square2.y <= point.y) && (point.y <= (square2.y + EDGE_LENGTH))) {
                //Check to see if they are the same squares
                if((square1.x != square2.x) && (square1.y != square2.y)) {
                    overlap = true;
                    break;
                }
            }
        }
    }
    
    return overlap;
}

/*
 * GetVertices(Square square)
 * Returns an array of vertices (vertex objects) for the given square
 */
function getVertices(square) {
    var verticeList = [];
    
    //Top Left
    verticeList.push( { 'x' : square.x,
                        'y' : square.y });
    //Top Right
    verticeList.push( { 'x' : square.x + EDGE_LENGTH,
                        'y' : square.y });
    //Bottom Left
    verticeList.push( { 'x' : square.x,
                        'y' : square.y + EDGE_LENGTH });
    //Bottom Right
    verticeList.push( { 'x' : square.x + EDGE_LENGTH,
                        'y' : square.y + EDGE_LENGTH });
    
    return verticeList;
}

/*
 * IsValidLocation(Square square, bool isSoldier):
 * Checks for screen boundary compliance in all cases.
 * If isSoldier is set to true, checks are performed on whether a soldier or gold piece lies on the location square.
 */
function isValidLocation(square, isSoldier) {
    var isValid = true;
    
    if(!inScreenBounds(square.x, square.y)) { isValid = false; }
    else {
        if(isSoldier) {
            for(var i = 0; i < GOLD_LIST.length; i++) {
                if(doesOverlap(square, getTempSquare(GOLD_LIST[i]))) {
                    isValid = false;
                }
            }
            
            for(var j = 0; j < SOLDIER_LIST.length; j++) {
                if(doesOverlap(square, getTempSquare(SOLDIER_LIST[j]))) {
                    isValid = false;
                }
            }
        }
    }
    
    return isValid;
}

/*
 * InScreenBounds(int x, int y):
 * Checks if given variables are within parent div width and height
 */
function inScreenBounds(x, y) {
    var isValid = false;
    
    if((x >= 0) && (x <= (GAME_WIDTH - EDGE_LENGTH))) {
        if((y >= 0) && (y <= (GAME_HEIGHT - EDGE_LENGTH))) {
            isValid = true;
        }
    }
    
    return isValid;
}

/*
 * GetTemSquare(JQuery Object[Element] origDiv):
 * Helper function for obtaining the Square representation of a Div DOM element. 
 */
function getTempSquare(origDiv) {
    return new Square(parseInt($(origDiv).css('left')), parseInt($(origDiv).css('top')));
}