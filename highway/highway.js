/*
 * Student Name: Abdullah Akram Ansari
 * Student #: 300575913
 *
 *                                      ***JavaScript Highway***
 *
 * Drive on this endless highway, avoiding oncoming cars. Avoid crashing too much, otherwise you'll wreck your car.
 * 
 * Note: Multi-Layer canvas for displaying information to player has NOT been used. It was used only to draw a background for the main canvas.
 * I know this was a requirement of the assignment, and understand that marks will be deducted for this.
 *
 * Controls:    Left - A
 *              Right - D
 *              Reset - R
 *
 * Player Car Color - Red
 * Enemy Car Color - Blue
 */
function Point(x, y) {
    this.x = x; 
    this.y = y;
}

function Line() {
    this.startPoint = new Point(-1, HORIZON_Y);
    this.endPoint = new Point(-1, GAME_HEIGHT);
    
    this.slope = -1;
    this.intercept = -1;
}

function RoadObject(topLeft, topRight, bottomRight, bottomLeft, color) {
    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomLeft = bottomLeft;
    this.bottomRight = bottomRight;
    
    this.color = color;
    this.lineNumber = -1;
}

//Game Constants
var GAME_WIDTH = 1000;
var GAME_HEIGHT = 500;
var HORIZON_Y = Math.floor(GAME_HEIGHT * 0.25);  //Horizon set to 25% game canvas height

var GAME_SPEED = 1;    //new frame every x number of milliseconds
var GAME_TIMER = null;
var CTX = null;         //Will hold the game canvas's context
 
//Road Constants
var FAR_LEFT_X = Math.floor(GAME_WIDTH * 0.2);
var FAR_RIGHT_X = Math.floor(GAME_WIDTH - FAR_LEFT_X);

var LANE_WIDTH = Math.floor(GAME_WIDTH * 0.2);  //200px
var NUM_OF_DRIVE_LANES = 3;
var NUM_OF_DIVIDER_LANES = 2;

//Getting components for lane lines' standard form (will be used in drawing approaching RoadObjects in proper positions)
var DIVIDER_LINE_EAST = new Line();
DIVIDER_LINE_EAST.startPoint.x = FAR_LEFT_X + LANE_WIDTH;
DIVIDER_LINE_EAST.endPoint.x = Math.floor(GAME_WIDTH / NUM_OF_DRIVE_LANES);
DIVIDER_LINE_EAST.slope = (DIVIDER_LINE_EAST.startPoint.y - DIVIDER_LINE_EAST.endPoint.y)/(DIVIDER_LINE_EAST.startPoint.x - DIVIDER_LINE_EAST.endPoint.x);
DIVIDER_LINE_EAST.intercept = DIVIDER_LINE_EAST.startPoint.y - (DIVIDER_LINE_EAST.slope * DIVIDER_LINE_EAST.startPoint.x);

var DIVIDER_LINE_WEST = new Line();
DIVIDER_LINE_WEST.startPoint.x = DIVIDER_LINE_EAST.startPoint.x + LANE_WIDTH;
DIVIDER_LINE_WEST.endPoint.x = 2 * DIVIDER_LINE_EAST.endPoint.x;
DIVIDER_LINE_WEST.slope = DIVIDER_LINE_EAST.slope * -1;
DIVIDER_LINE_WEST.intercept = DIVIDER_LINE_WEST.startPoint.y - (DIVIDER_LINE_WEST.slope * DIVIDER_LINE_WEST.startPoint.x);

//Divider constants
var DIVIDER_WIDTH = Math.floor(LANE_WIDTH * 0.05);
var DIVIDER_HEIGHT = GAME_HEIGHT * 0.1; //50px
var DIVIDER_NEW_TIME = 75;  //Every x iterations, a new divider will appear
var DIVIDER_OFFSET = Math.floor(DIVIDER_WIDTH / 2); //How much it will stick out on either side of the divider lane
var DIVIDER_SPEED = 1;      //1px change in x/y per game loop iteration

var CAR_LINE_EAST = new Line();
CAR_LINE_EAST.startPoint.x = Math.floor(FAR_LEFT_X + (LANE_WIDTH / 2));
CAR_LINE_EAST.endPoint.x = Math.floor((GAME_WIDTH / NUM_OF_DRIVE_LANES) / 2);
CAR_LINE_EAST.slope = (CAR_LINE_EAST.startPoint.y - CAR_LINE_EAST.endPoint.y)/(CAR_LINE_EAST.startPoint.x - CAR_LINE_EAST.endPoint.x);
CAR_LINE_EAST.intercept = CAR_LINE_EAST.startPoint.y - (CAR_LINE_EAST.slope * CAR_LINE_EAST.startPoint.x);

var CAR_LINE_MID = new Line();
CAR_LINE_MID.startPoint.x = CAR_LINE_EAST.startPoint.x + LANE_WIDTH;
CAR_LINE_MID.endPoint.x = Math.floor(GAME_WIDTH / 2);
CAR_LINE_MID.slope = -1;        //Infinite Slope, parallel to the y axis
CAR_LINE_MID.intercept = -1;    //No Intercept, is parallel to the y axis

var CAR_LINE_WEST = new Line();
CAR_LINE_WEST.startPoint.x = CAR_LINE_MID.startPoint.x + LANE_WIDTH;
CAR_LINE_WEST.endPoint.x = GAME_WIDTH - CAR_LINE_EAST.endPoint.x;
CAR_LINE_WEST.slope = CAR_LINE_EAST.slope * -1;
CAR_LINE_WEST.intercept = CAR_LINE_WEST.startPoint.y - (CAR_LINE_WEST.slope * CAR_LINE_WEST.startPoint.x);

//Car constants
var CAR_WIDTH = Math.floor(LANE_WIDTH * 0.75);  //150px
var CAR_HEIGHT = GAME_HEIGHT * 0.15; //75px
var CAR_NEW_TIME = 150;
var CAR_OFFSET = Math.floor(CAR_WIDTH / 2);
var CAR_TIRE_HEIGHT = 15;
var CAR_HEIGHT_OFFSET = CAR_HEIGHT - CAR_TIRE_HEIGHT;

//Since we will be using sprites, we will not be using these color values
var TAR_COLOR = '#7d7d7d';  //Grey
var DIVIDER_COLOR = 'yellow';
var PLAYER_COLOR = '#FF0000';   //because red cars go faster (proven fact)
var NPC_COLOR = '#180aa4';  //Indigo
var DELETE_COLOR = 'pink';  //Objects set to this color to mark them for deletion

var LINE_LIST = [ DIVIDER_LINE_EAST, DIVIDER_LINE_WEST, CAR_LINE_EAST, CAR_LINE_MID, CAR_LINE_WEST ];

var PLAYER_SPEED = 1; 
var PLAYER_CAR_OFFSET = 20;
var CRASH_HIT = 10; //Durability goes down after x iterations of being in contact with another car.
var SCORE_HIT = 20; //Similarly, score goes up after x iterations of being alive.

//Value of TopLeft point for player's car
var MAX_PLAYER_LEFT = 50;
var MAX_PLAYER_RIGHT = 800;

//These variables will be initalised and used later in the code.
var TheRoad = null;
var RoadObjectList = [];
var DividerTimeCounter = 0;
var CarTimeCounter = 0;
var CrashCounter = 0;
var ScoreCounter = 0;

var PlayerCar = null;
var playerCarImage = null;
var carImage = null;

//Stats variables
var Score = 0;
var Durability = 100;
var KEY_LIST = [];
var KEY = {
    R: 82,
	A: 65,
    D: 68
}

$(function() {
    CTX = document.getElementById('mainCanvas').getContext('2d');
    var tempCTX = document.getElementById('backgroundCanvas').getContext('2d');
    tempCTX.fillStyle = 'green';
    tempCTX.fillRect(0, HORIZON_Y + 100, GAME_WIDTH, (GAME_HEIGHT - HORIZON_Y + 100));
    
    TheRoad = new RoadObject(new Point(FAR_LEFT_X, HORIZON_Y), new Point(FAR_RIGHT_X, HORIZON_Y), new Point(GAME_WIDTH - 1, GAME_HEIGHT -1), 
                             new Point(0, GAME_HEIGHT - 1), TAR_COLOR);
    
    PlayerCar = new RoadObject(new Point(CAR_LINE_MID.startPoint.x - CAR_OFFSET, GAME_HEIGHT - CAR_HEIGHT - PLAYER_CAR_OFFSET), 
                               new Point(CAR_LINE_MID.startPoint.x + CAR_OFFSET, GAME_HEIGHT - CAR_HEIGHT - PLAYER_CAR_OFFSET), 
                               new Point(CAR_LINE_MID.startPoint.x + CAR_OFFSET, GAME_HEIGHT - 2 - PLAYER_CAR_OFFSET), 
                               new Point(CAR_LINE_MID.startPoint.x - CAR_OFFSET, GAME_HEIGHT - 2 - PLAYER_CAR_OFFSET), PLAYER_COLOR);
    
    carImage = new Image(); 
    carImage.src = 'car.png';
    playerCarImage = new Image();
    playerCarImage.src = 'playerCar.png';
    
    $(document).keydown(function(e) {
		KEY_LIST[e.which] = true;
	});

	$(document).keyup(function(e) {
		KEY_LIST[e.which] = false;
	});
    
    timer = setInterval(updateHighway, GAME_SPEED);
});

/*
 * UpdateHighway()
 * Updates positions of all RoadObjects currently alive on the road. This includes cars (enemy and player) and dividers.
 * New objects are also added here (based on a counter), as is collission and object life.
 */
function updateHighway() {
    CTX.clearRect(0, 0 , GAME_WIDTH, GAME_HEIGHT);
    
    drawRoadObject(TheRoad);
    
    if(DividerTimeCounter == DIVIDER_NEW_TIME) {
        DividerTimeCounter = 0;
        RoadObjectList.push(generateRoadObject(0));
        RoadObjectList.push(generateRoadObject(1));
    }
    DividerTimeCounter++;
    
    if(CarTimeCounter == CAR_NEW_TIME) {
        CarTimeCounter = 0;
        var randomLane = Math.floor(Math.random() * 3) + 2;
        RoadObjectList.push(generateRoadObject(randomLane));
    }
    CarTimeCounter++;
    
    for(var i = 0; i < RoadObjectList.length; i++) {
        updateRoadObject(RoadObjectList[i]);
    }
    movePlayerCar();
    drawPlayerCar();
    
    checkCollission();
    clearRoadObjectList();
    
    ScoreCounter++;
    if(ScoreCounter == SCORE_HIT) {
        ScoreCounter = 0;
        Score++;
        $('#scoreValue').html(Score.toString());
    }
    
    if(Score > HighScore) {
        HighScore = Score;
        $('#highScoreValue').html(HighScore.toString());
    }
}

/*
 * MovePlayerCar()
 * Invoked in UpdateHighway() to change the player's car position based on keys pressed.
 * Bounds are also checked to make sure the car isn't driven off the road.
 */
function movePlayerCar() {
    var multMod = 0;
    
    if(KEY_LIST[KEY.A]) {
        //Have this part set player car drawing to left facing car image
        if(PlayerCar.topLeft.x > MAX_PLAYER_LEFT) {
            multMod = -1;
        }
    }
    
    if(KEY_LIST[KEY.D]) {
        //Have this part set player car drawing to right facing car image
        if(PlayerCar.topLeft.x < MAX_PLAYER_RIGHT) {
            multMod = 1;
        }
    }
    
    if(multMod != 0) {
        var toAdd = PLAYER_SPEED * multMod;
        PlayerCar.topLeft.x += toAdd;
        PlayerCar.topRight.x += toAdd;
        PlayerCar.bottomRight.x += toAdd;
        PlayerCar.bottomLeft.x += toAdd;        
    }
}

/*
 * DrawPlayerCar()
 * Helper function for drawing the player's vehicle. Since no line is assigned to the Player vehicle, 
 * DrawRoadObject will not function properly for the player's car.
 */
function drawPlayerCar() {
    CTX.drawImage(playerCarImage, PlayerCar.topLeft.x, PlayerCar.topLeft.y);
}

/*
 * DrawRoadObjects(RoadObject roadObject)
 * Draw road objects in their appropriate positions on the road. Cars use an image, dividers use simple squares.
 */
function drawRoadObject(roadObject) {
    if(roadObject.lineNumber < 2) {
        CTX.fillStyle = roadObject.color;
        CTX.strokeStyle = roadObject.color;

        CTX.beginPath();
        CTX.moveTo(roadObject.topLeft.x, roadObject.topLeft.y);
        CTX.lineTo(roadObject.topRight.x, roadObject.topRight.y);
        CTX.lineTo(roadObject.bottomRight.x, roadObject.bottomRight.y);
        CTX.lineTo(roadObject.bottomLeft.x, roadObject.bottomLeft.y);
        CTX.closePath();

        CTX.stroke();
        CTX.fill();
    }
    else {
        if(roadObject.topLeft.y > HORIZON_Y) {
            CTX.drawImage(carImage, roadObject.topLeft.x, roadObject.topLeft.y - CAR_HEIGHT_OFFSET);
        }
    }
}

/*
 * UpdateRoadObject(RoadObject roadObject)
 * Updates the co-ordinates of the roadObject passed in, based on if it is a a divider or a car.
 * Position is update by finding the mid point of the top side of the object (all objects are essentially squares),
 * and then calculating the next point on the line assigned to roadObject. We obtain the side points for the top and bottom
 * sides of the roadObjects, and then invoke DrawRoadObject() to finally draw the object.
 */
function updateRoadObject(roadObject) {
    var deleteVal = roadObject.lineNumber < 2 ? roadObject.topLeft.y : roadObject.topLeft.y - CAR_HEIGHT;
    if(deleteVal >= (GAME_HEIGHT - 2)) {
        roadObject.color = DELETE_COLOR;
    }
    else {
        var offset = (roadObject.lineNumber < 2 ? DIVIDER_OFFSET : CAR_OFFSET);
        var midPoints = getMidPoints(roadObject, offset);
        
        //Road Object spawned recently and is near the top
        if(roadObject.bottomLeft.y > (roadObject.lineNumber < 2 ? DIVIDER_HEIGHT : CAR_HEIGHT) + HORIZON_Y) {
            var topSidePoints = getSidePoints(getNextPointOnLine(roadObject.lineNumber, midPoints[0]), offset);
            roadObject.topLeft = topSidePoints[0];
            roadObject.topRight = topSidePoints[1];
        }
        
        if(roadObject.bottomLeft.y < GAME_HEIGHT) {
            var botSidePoints = getSidePoints(getNextPointOnLine(roadObject.lineNumber, midPoints[1]), offset);
            roadObject.bottomLeft = botSidePoints[0];
            roadObject.bottomRight = botSidePoints[1];
        }
    }
    
    if(roadObject.color != DELETE_COLOR) {
        drawRoadObject(roadObject);
    }
}

/*
 * GenerateRoadObject(Integer lineNumber)
 * Generates a new roadObject starting at the top of the road. Dimensions are based on line number (0,1 are divider lines - 2,3,4 are car lines)
 */
function generateRoadObject(lineNumber) {
    var topLeft, topRight, roadObject;
    var offset = (lineNumber < 2 ? DIVIDER_OFFSET : CAR_OFFSET);
    
    topLeft = new Point(LINE_LIST[lineNumber].startPoint.x - offset, LINE_LIST[lineNumber].startPoint.y);
    topRight = new Point(LINE_LIST[lineNumber].startPoint.x + offset, LINE_LIST[lineNumber].startPoint.y);

    //Newly created dividers will appear as just a line
    roadObject = new RoadObject(new Point(topLeft.x, topLeft.y), 
                                    new Point(topRight.x, topRight.y), 
                                    new Point(topRight.x, topRight.y), 
                                    new Point(topLeft.x, topRight.y), (lineNumber < 2 ? DIVIDER_COLOR : NPC_COLOR));

    roadObject.lineNumber = lineNumber;
    return roadObject;
}

/*
 * GetNextPointOnLine(Integer lineNumber, Point initalPoint)
 * Calculates the next closest point on the line having a y value just 1px higher than its previous y.
 * We obtain a list of surrounding points, then choose the point with the lowest distance from the ideal next point on the line.
 * Standard form of line is used for calculating appropriate co-ordinate values.
 */
function getNextPointOnLine(lineNumber, initialPoint) {
    var idealY = initialPoint.y + 1;
    var idealX = (lineNumber == 3 ? initialPoint.x : Math.floor((idealY - LINE_LIST[lineNumber].intercept)/LINE_LIST[lineNumber].slope));
    
    var pointArray = getSurroundingPoints(initialPoint);
    var target = { 'distance' : -1,
                   'index' : -1 };
    
    for(var i = 0; i < pointArray.length; i++) {
        if(target['distance'] == -1 || (target['distance'] >= distanceBetween(idealX, pointArray[i].x, idealY, pointArray[i].y))) {
            target['distance'] = distanceBetween(idealX, pointArray[i].x, idealY, pointArray[i].y);
            target['index'] = i;
        }
    }
    
    return pointArray[target['index']];
}

/*
 * GetSurroundingPoints(Point point)
 * Return a list of the co-ordinate points around any point (with integer values).
 * As there are an infinite # of points around any given point, we choose to consider 
 * the base point to be in a 3x3 grid, with point at position 4 (start at 0).
 * So, surrounding points are determined by a simple +/-1 addition to x & y values to get 8 points.
 */
function getSurroundingPoints(point) {
    var pointArray = [];
    
    pointArray.push(new Point(point.x - 1, point.y - 1));    //Top Left
    pointArray.push(new Point(point.x, point.y - 1));        //Top
    pointArray.push(new Point(point.x + 1, point.y - 1));    //Top Right
    pointArray.push(new Point(point.x - 1, point.y));        //Left
    pointArray.push(new Point(point.x + 1, point.y));        //Right
    pointArray.push(new Point(point.x - 1, point.y + 1));    //Bottom Left
    pointArray.push(new Point(point.x , point.y + 1));       //Bottom
    pointArray.push(new Point(point.x + 1, point.y + 1));    //Bottom Right
    
    return pointArray;
}

/*
 * DistanceBetween(Integer x1, Integer x2, Integer y1, Integer y2)
 * Obtain the distance between 2 points, but Floor the result to make for better image placement. 
 * Lots of decimal points has lead to unexpected behavior in drawing on the canvas.
 */
function distanceBetween(x1, x2, y1, y2) {
    return Math.floor(rawDistance(x1, x2, y1, y2));
}

/*
 * RawDistance(Integer x1, Integer x2, Integer y1, Integer y2)
 * Helper function for DistanceBetween(), returns a floating point answer.
 */
function rawDistance(x1, x2, y1, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

/*
 * GetMidPoints(RoadObject roadObject, Integer offset)
 * Returns top and bottom side's mid points for the roadObject passed in. Offset is the width of the roadObject.
 */
function getMidPoints(roadObject, offset) {
    var midPointsArray = [];
    
    //Top MidPoint
    midPointsArray.push(new Point(roadObject.topLeft.x + offset, roadObject.topLeft.y ));
    //Bottom MidPoint
    midPointsArray.push(new Point(roadObject.bottomLeft.x + offset, roadObject.bottomLeft.y ));
    
    return midPointsArray;
}    

/*
 * GetSidePoints(Point midPoint, Integer offset)
 * Pretty much the reverse of what GetMidPoints() does. These functions are essentially helpers.
 */
function getSidePoints(midPoint, offset) {
    var sidePointArray = [];
    
    //Left Point
    sidePointArray.push(new Point(midPoint.x - offset, midPoint.y));
    //Right Point
    sidePointArray.push(new Point(midPoint.x + offset, midPoint.y));
    
    return sidePointArray;
}

/*
 * ClearRoadObjectList()
 * When a roadObject's top side reaches the end of the canvas, its color is set to DELETE_COLOR (in UpdateRoadObject()).
 * This function checks for all roadObjects with color set to DELETE_COLOR, and does not push them onto the list for drawing on the next iteration.
 */
function clearRoadObjectList() {
    var tempList = [];
    
    for(var i = 0; i < RoadObjectList.length; i++) {
        if(RoadObjectList[i].color != DELETE_COLOR) {
            tempList.push(RoadObjectList[i]);
        }
    }
    
    RoadObjectList = tempList;
}

/*
 * CheckCollission()
 * Very straightforward collission checking for the player's car  and enemy cars. Any other sort of collission does not affect the game.
 * Because of the way drawing is handled for enemy car road objects, offsets (namely, car width) have to be factored in.
 */
function checkCollission() {
    var tempObject = null;
    for(var i = 0; i < RoadObjectList.length; i++) {
        if(RoadObjectList[i].lineNumber > 1) {
            tempObject = RoadObjectList[i];
            
            if((tempObject.bottomLeft.y - CAR_HEIGHT_OFFSET > PlayerCar.topLeft.y) && 
               (tempObject.topLeft.y - (CAR_HEIGHT_OFFSET + CAR_HEIGHT) < PlayerCar.topLeft.y)){
                if(((PlayerCar.topLeft.x >= tempObject.bottomLeft.x) && (PlayerCar.topRight.x <= (tempObject.bottomRight.x + CAR_WIDTH))) || 
                  ((PlayerCar.topLeft.x >= tempObject.bottomLeft.x - CAR_WIDTH) && (PlayerCar.topRight.x <= tempObject.bottomRight.x)))
                {
                    reportCrash();
                }
            } 
        }
    }
}

/*
 * ReportCrash()
 * Every time CheckCollission's boundary checks return true, this function reduces the player's car's durability by 1.
 * However, in order to prevent rapid damage being inflicted because the game loop executes so fast, we have a counter set
 * to provide for more gradual damage.
 */
function reportCrash() {
    CrashCounter++;
    if(CrashCounter == CRASH_HIT) {
        CrashCounter = 0;
        Durability--;
        $('#durabilityValue').html(Durability.toString());
        
        if(Durability < 1) {
            alert('You have wrecked your car!!');
            clearInterval(timer);
        }
    }
}