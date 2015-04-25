/* 
 * COMP-397- :: Web Game Propgramming - Assignment #3
 *           
 * Name: Abdullah Akram Ansari
 * Student #: 300575913
 * 
 *
 *                                    ***JavaScript Space Fighter***
 *
 * Classic arcade game, survive progressively tougher waves of projectiles, enemies, while attacking the boss.
 *
 * Problems: NO SOUND! SPRITESHEET IMAGES NOT PROPERLY ALIGNED! UNFINISHED FEEL TO THE GAME!
 *
 * Controls:
 * WASD - Move
 */

//Point Class - Stores the x and y co-ordinates of a point on the canvas
function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Projectile(point, side) {
    this.point = point;
    
    this.changeX = 1;
    this.changeY = 0;
    
    this.width = PROJECTILE_EDGE;
    this.height = PROJECTILE_EDGE;
    
    this.side = side;
    this.hp = 1;    //Projectiles die immediately after colliding with an enemy
}

function Ship(point, width, height, side, hp) {
    this.point = point;
    
    this.width = width;
    this.height = height;
    
    this.changeX = -1;
    this.changeY = 0;
    
    this.imageXOffset = 0;
    this.imageYOffset = 0;
    
    this.side = side;
    this.hp = hp;
}

//Game Constants
var SCORE_CTX = null;
var CTX = null;
var GAME_SPEED = 30;      //ms
var GAME_WIDTH = 1000;
var GAME_HEIGHT = 550;
var GAME_TIMER = null;
var DELETION_HP = -100;    //Assign this as the hp of objects to be deleted on next iteration
var RANDOMIZE_COUNTER = 0;
var RANDOMIZE_WHEN = 150;

var ENEMY_HP = 3;
var ENEMY_IMAGE_WIDTH = 40;
var ENEMY_IMAGE_HEIGHT = 40;
var ENEMY_WIDTH = 20;
var ENEMY_HEIGHT = 20;
var ENEMY_LIST = [];
var ENEMIES_TO_SPAWN = 2;
var ENEMY_INCREASE_COUNTER = 0;
var INCREASE_ENEMIES_WHEN = 500;
var SPAWN_ENEMIES_WHEN = 150;
var SPAWN_COUNTER = 0;

var PLAYER = null;
var PLAYER_WIDTH = 10;
var PLAYER_HEIGHT= 10;
var PLAYER_HP = 25;
var SCORE = 0;

var PROJECTILE_LIST = [];
var PROJECTILE_EDGE = 3;
var PROJECTILE_SPAWN_WHEN = 100;
var PROJECTILE_COUNTER = 0;
var PLAYER_PROJECTILE_COUNTER =0;
var PLAYER_PROJECTILE_COUNTER_INCREMENT = 10;

var SIDE = {
    P : 1,  //Player
    E : 2   //Enemy
}

//Player Ability Constants
var SHIELD_DURATION = 500;
var SHIELD_RECHARGE_TIME = 500;
var SHIELD_COUNTER = 0;
var SHIELD_ACTIVE = false;

var BOMB_DAMAGE = 10;
var BOMB_RECHARGE_TIME = 500;
var BOMB_COUNTER = 0;

var KEY_LIST = [];
var KEY = {
	W: 87,
    A: 65,
	S: 83,
    D: 68,
    Q: 81,
    E: 69
}

$(function() {
    SCORE_CTX = document.getElementById('backgroundCanvas').getContext('2d');
    SCORE_CTX.font = '15px bold arial';
    SCORE_CTX.fillStyle = 'white';
    
    CTX = document.getElementById('mainCanvas').getContext('2d');
    GAME_TIMER = setInterval(gameLoop, GAME_SPEED);
    PLAYER = new Ship(new Point(50, 50), PLAYER_WIDTH, PLAYER_HEIGHT, SIDE.P, PLAYER_HP);   
    
    $(document).keydown(function(e) {
		KEY_LIST[e.which] = true;
	});

	$(document).keyup(function(e) {
		KEY_LIST[e.which] = false;
	});
});

/*
 * GameLoop():
 * Will be called by the GAME_TIMER timer object. All drawing, position and score updates are called from here.
 */
function gameLoop() {
    drawObjects();
    movePlayer();
    spawnBullet();
    spawnEnemies();
    checkCollissions();
    checkEnemyBounds();
    deleteObjects();
    randomizeMovement();
    checkPlayer();
}

/*
 * RandomizeMovement()
 * Changes the movement variables whenever the counter limit is reached. Gives a more dynamic feel to enemy ships.
 */
function randomizeMovement() {
    if(RANDOMIZE_COUNTER == RANDOMIZE_WHEN) {
        for(var i = 0; i < ENEMY_LIST.length; i++) {
            ENEMY_LIST[i].changeX = Math.floor(Math.random() * 4) * -1;
            ENEMY_LIST[i].changeY = Math.floor(Math.random() * 4) * ((Math.floor(Math.random() * 2) == 1) ? -1 : 1);
        }
        
        RANDOMIZE_COUNTER = 0;
    }
    
    RANDOMIZE_COUNTER++;
}

/*
 * MovePlayer()
 * Movement function for the player's ship.
 */
function movePlayer() {
    var tempPoint = new Point(PLAYER.point.x, PLAYER.point.y);
    
    if(KEY_LIST[KEY.W]) {
        tempPoint.y -= 2;
    }
    if(KEY_LIST[KEY.A]) {
        tempPoint.x -= 2;
    }
    if(KEY_LIST[KEY.S]) {
        tempPoint.y += 2;
    }
    if(KEY_LIST[KEY.D]) {
        tempPoint.x += 2;
    }
    
    //short circuit evaluation
    if(inScreenBounds(tempPoint, PLAYER)) {
        PLAYER.point = tempPoint;
    }
    
    //checkConditions();
}

/*
 * UpdateObject(Projectile/Shipt obj)
 * Movement function for enemy ships and projectiles.
 */
function updateObject(obj) {
    var newPoint = new Point(obj.point.x + obj.changeX, obj.point.y + obj.changeY);
    obj.point = newPoint;
}

/*
 * SpawnEnemies()
 * Spawns a new set of enemy ships at the right edge of the game map. Enemies spawned gradually increasy in number.
 */
function spawnEnemies() {
    if(SPAWN_COUNTER == SPAWN_ENEMIES_WHEN) {
        var tempShip = null;
        for(var i = 0; i < ENEMIES_TO_SPAWN; i++) {
            tempShip = new Ship(new Point(GAME_WIDTH - ENEMY_WIDTH, Math.floor(Math.random() * (GAME_HEIGHT - ENEMY_HEIGHT))), ENEMY_WIDTH, ENEMY_HEIGHT, SIDE.E, ENEMY_HP);
            
            tempShip.imageXOffset = Math.floor(Math.random() * 15) * ENEMY_IMAGE_WIDTH + 5;
            tempShip.imageYOffset = 15;
            ENEMY_LIST.push(tempShip);
        }
        SPAWN_COUNTER = 0;
    }
    
    if(ENEMY_INCREASE_COUNTER == INCREASE_ENEMIES_WHEN) { 
        ENEMIES_TO_SPAWN++;
        ENEMY_INCREASE_COUNTER = 0;
    }
    
    ENEMY_INCREASE_COUNTER++;
    SPAWN_COUNTER++;
}

/*
 * InScreenBounds(int x, int y, Object obj)
 * Checks if given variables are within parent canvas width and height
 */
function inScreenBounds(point, obj) {
    var isValid = false;
    
    if((point.x >= 0) && (point.x <= (GAME_WIDTH - obj.width))) {
        if((point.y >= 0) && (point.y <= (GAME_HEIGHT - obj.height))) {
            isValid = true;
        }
    }
    
    return isValid;
}

/*
 * OutOfBounds(Ship/Projectile obj)
 * Checks if the ship/projectile argument has left screen bounds. This is how we check if an enemy ship or projectile should be deleted.
 */
function outOfBounds(obj) {
    var outOfBounds = false;
    
    if((obj.point.x >= GAME_WIDTH) || (obj.point.x + obj.width <= 0)) {
        outOfBounds = true;
    }
    if((obj.point.y >= GAME_HEIGHT) || (obj.point.y + obj.height <= 0)) {
        outOfBounds = true;
    }
    
    return outOfBounds;
}

/*
 * HasCollided(Ship/Projectile obj1, obj2)
 * Collission detection functions. Checks if any of the points in a given obj variable lie within the other object.
 */
function hasCollided(obj1, obj2) {
    var overlap = false;
    var obj2Points = getVertices(obj2.point, obj2.width, obj2.height);
    var point2, i, j;
    
    for(i = 0; i < obj2Points.length; i++) {
        point2 = obj2Points[i];
        
        if((point2.x >= obj1.point.x) && (point2.x <= obj1.point.x + obj1.width)) {
            if((point2.y >= obj1.point.y) && (point2.y <= obj1.point.y + obj1.height)) {
                overlap = true;
            }
        }
    }
    
    return overlap;
}

/*
 * GetVertices(Point point, int width, int height)
 * Returns the four vertices of a square(rectangle) object.
 */
function getVertices(point, width, height) {
    var x = point.x, y = point.y;
    var verticeList = [];
    
    //Top Left
    verticeList.push( { 'x' : x,
                        'y' : y } );
    //Top Right
    verticeList.push( { 'x' : x + width,
                        'y' : y } );
    //Bottom Left
    verticeList.push( { 'x' : x,
                        'y' : y + height } );
    //Bottom Right
    verticeList.push( { 'x' : x + width,
                        'y' : y + height } );
    
    return verticeList;
}

/*
 * DrawObjects()
 * Draws images, rectangles representing screen objects. (Bullets and the player's red square ship)
 */
function drawObjects() {
    SCORE_CTX.clearRect(0, 0, 1000, 10);
    SCORE_CTX.fillText('Score: ' + SCORE, 5, 10);
    SCORE_CTX.fillText('Health: ' + (PLAYER.hp * 4) + '%', 100, 10);
    
    CTX.clearRect(0,0,GAME_WIDTH,GAME_HEIGHT);
    drawRect(PLAYER.point, PLAYER.height, PLAYER.width, 'red');
    
    for(var i = 0; i < ENEMY_LIST.length; i++)
    {
        updateObject(ENEMY_LIST[i]);
        drawImage(ENEMY_LIST[i]);
        //drawRect(ENEMY_LIST[i].point, ENEMY_HEIGHT, ENEMY_WIDTH, 'pink');
    }
    
    var colorString = null
    for(var j = 0; j < PROJECTILE_LIST.length; j++)
    {
        updateObject(PROJECTILE_LIST[j]);
        
        if(PROJECTILE_LIST[j].side == SIDE.E) { colorString = 'green'; }
        else { colorString = 'yellow'; }
        
        drawRect(PROJECTILE_LIST[j].point, PROJECTILE_EDGE, PROJECTILE_EDGE, colorString);
    }
}

/*
 * DrawImages(Ship obj)
 * Draws an enemy image from the provided image (spritesheet). IMAGES NOT ALIGNED PROPERLY!!
 */
function drawImage(obj) {
    CTX.drawImage(document.getElementById('enemySheet'), obj.imageXOffset, obj.imageYOffset, ENEMY_IMAGE_WIDTH, ENEMY_IMAGE_HEIGHT, obj.point.x, obj.point.y, obj.width, obj.height);
}

/*
 * DrawRect(Point point, int widht, int height, string color)
 * Simple rectangle rendering function, uses moveTo() and fill functions.
 */
function drawRect(point, height, width, color) {
    CTX.fillStyle = color;
    CTX.beginPath();
    CTX.moveTo(point.x, point.y);
    CTX.lineTo(point.x + width, point.y);
    CTX.lineTo(point.x + width, point.y + height);
    CTX.lineTo(point.x, point.y + height);
    CTX.closePath()
    CTX.fill();
}

/*
 * SpawnBullet()
 * Spawns bullets of fixed and variable speeds/directions in front of the player ship and enemy ships.
 * Bullets are randomly assigned this value; makes the game a little more challenging when the number of ships increases.
 */
function spawnBullet()
{
    if(PLAYER_PROJECTILE_COUNTER == PROJECTILE_SPAWN_WHEN) {
        var tempBullet = new Projectile(new Point(PLAYER.point.x + PLAYER_WIDTH, PLAYER.point.y + PLAYER_HEIGHT/2), SIDE.P);
        tempBullet.changeX = 3;
        PROJECTILE_LIST.push(tempBullet);
        
        PLAYER_PROJECTILE_COUNTER = 0;
    }
    
    if(PROJECTILE_COUNTER == PROJECTILE_SPAWN_WHEN) {    
        for(var i = 0; i < ENEMY_LIST.length; i++) {
            tempBullet = new Projectile(new Point(ENEMY_LIST[i].point.x, ENEMY_LIST[i].point.y + ENEMY_HEIGHT/2), SIDE.E);
            
            if(Math.floor(Math.random() * 2) == 0) {
                tempBullet.changeX = Math.floor(Math.random() * 4) * -1;
                tempBullet.changeY = Math.floor(Math.random() * 4) * (Math.floor(Math.random() * 2) == 1 ? 1 : -1);   
            }
            else { tempBullet.changeX = -1; }
            
            PROJECTILE_LIST.push(tempBullet);
        }
        
        PROJECTILE_COUNTER = 0;
    }
    
    PLAYER_PROJECTILE_COUNTER += PLAYER_PROJECTILE_COUNTER_INCREMENT;
    PROJECTILE_COUNTER++;
}

/*
 * CheckCollissions()
 * Checks collissions between objects of different sides, and adjusts hp accordingly. Ships do not hurt each other if they collide, as don't projectiles from the
 * same side. Also marks bullets for deletion if they have crossed screen bounds.
 */
function checkCollissions() {
    for(var i = 0; i < PROJECTILE_LIST.length; i++) {
        if(PROJECTILE_LIST[i].side == SIDE.E) {
            if(hasCollided(PLAYER, PROJECTILE_LIST[i])) {
                PROJECTILE_LIST[i].hp--;
                PLAYER.hp--;
            }
        }
        else {
            for(var j = 0; j < ENEMY_LIST.length; j++) {
                if(hasCollided(ENEMY_LIST[j], PROJECTILE_LIST[i])) {
                    PROJECTILE_LIST[i].hp--;
                    ENEMY_LIST[j].hp--;
                }
            }
        }
        
        if(outOfBounds(PROJECTILE_LIST[i])) {
            PROJECTILE_LIST[i].hp = DELETION_HP;
        }
    }
}

/*
 * CheckEnemyBounds()
 * Checks if an enemy has crossed screen bounds, and marks it for deletion if it has.
 */
function checkEnemyBounds() {
    for(var i =0; i < ENEMY_LIST.length; i++) {
        if(outOfBounds(ENEMY_LIST[i])) {
            ENEMY_LIST[i].hp = DELETION_HP;
        }
    }
}
           
/*
 * DeleteObjects()
 * Deletes all objects that have reached >0 hp, either through being attacked or by leaving screen bounds.
 */
function deleteObjects() {
    var tempList = [];
    for(var i = 0; i < PROJECTILE_LIST.length; i++) {
        if(PROJECTILE_LIST[i].hp > 0) {
            tempList.push(PROJECTILE_LIST[i]);
        }
    }
    PROJECTILE_LIST = tempList;
    
    tempList = [];
    for(var j = 0; j  < ENEMY_LIST.length; j++) {
        if(ENEMY_LIST[j].hp > 0) {
            tempList.push(ENEMY_LIST[j]);
        }
        else {
            if(ENEMY_LIST[j].hp != DELETION_HP) { SCORE++; }
        }
    }
    ENEMY_LIST = tempList;
}

/*
 * CheckPlayer()
 * Checks the player's hp; in case the player has reached <= 0 hp, ends the game, assigns high scores and alerts the player.
 * LocalStorage used to store highest score reached in game.
 */
function checkPlayer() {
    if(PLAYER.hp < 1) {
        var highScore = localStorage.getItem('HighScore');
        if(highScore == null || highScore < SCORE) {
            localStorage.setItem('HighScore', SCORE);
            highScore = SCORE;
        }
        
        clearInterval(GAME_TIMER);
        alert("You're spaceship has been destroyed!!\nYour Score: " + SCORE + "\nHigh Score: " + highScore);
    }
}
