var server = require('websocket').server, http = require('http');

var express = require('express'),
app = express();
app.set('view engine', 'html');
app.use(express.static(__dirname));

var webServer = app.listen(8080);

var socket = new server({
    httpServer: http.createServer().listen(1990)
});

var hunterSocket = new server({
    httpServer: http.createServer().listen(1991)
});

var preySocket = new server({
    httpServer: http.createServer().listen(1992)
});

var connection1 = null;
var connection2 = null;
var connection3 = null;
var MAX_WALLS = 5;
var COOL_DOWN_TIME = 2;
var time = 0;
var timeSinceLastBuild = -100;
var lastWallId = 0;
var errorList = [];

var Wall, isPointOnWall, isWallIntersecting, line_intersects, move, moveHunter, movePrey, startPoint, useCoords, useLines, wall1, wall2;
var RotationDirection, buildWallCoolingDown, canDeleteWall, cardinalDirections, compareToPoint, getCardinalDirection, hasHunterWon, isSquished, isWallIntersectingHunter, isWallIntersectingPrey, numWallsIsMaxed, willWallCauseSquishing, isValidWall;

Wall = (function() {
    function Wall(position, length, direction) {
      this.position = position;
      this.length = length;
      this.direction = direction;
    }

    return Wall;

  })();


var errorCodes = {
      I_WALL: 0,
      I_HUNT: 1,
      I_PREY: 2,
      SQUISH: 3,
      WAIT_TIME: 4,
      TOO_MANY_WALLS: 5,
      DELETE_FAILED: 6
  };
var errorCodesMessages = ["This wall intersects another wall",
                  "This wall intersects the hunter",
                  "This wall intersects the prey",
                  "This wall causes squishing",
                  "Not enough time has elapsed since last build",
                  "You've built too many walls brother. Time to start thinking about tearing them down."
                  ];

EvasionError = (function() {
  function EvasionError(message, code, data) {
    this.message = message;
    this.code = code;
    this.reason = errorCodesMessages[code];
    this.data = data;
  }

  return EvasionError;
})();


var cardinalDirections = {
    N: [0,-1],
    S: [0,1],
    E: [1,0],
    W: [-1,0],
    NE: [1,-1],
    NW: [-1,-1],
    SE: [1,1],
    SW: [-1,1]
};

var walls = [];

var leftWall = new Wall([-1, -1], 302, cardinalDirections.S);
var rightWall = new Wall([301, -1], 302, cardinalDirections.S);
var topWall = new Wall([0, -1], 300, cardinalDirections.E);
var bottomWall = new Wall([0, 301], 300, cardinalDirections.E);
var globalWalls = [leftWall, rightWall, topWall, bottomWall];

var connectionArray = [];

function publish (data) {
  for (var i = 0; i < connectionArray.length; i++) {
    connectionArray[i].send(data);
  }
}

socket.on('request', function(request) {
    connectionArray.push(request.accept(null, request.origin));
});

hunterSocket.on('request', function(request) {
    connection2 = request.accept(null, request.origin);
    connection2.on('message', function(message) {
        //{command:'P'}
        //{command:'W'}
        //console.log(message);
        var data = JSON.parse(message.utf8Data);
        if (data.command == "P" || data.command == 'W') {
            process(data,connection2);
        }
        else {
            sendMove({data:data, fun:processHunter})
        };
        //processHunter(data);

    });
});

preySocket.on('request', function(request) {
    connection3 = request.accept(null, request.origin);
    connection3.on('message', function(message) {
        var data = JSON.parse(message.utf8Data);
        if (data.command == "P" || data.command == 'W') {
            process(data,connection3);
        }
        else {
            //console.log(moves);
            sendMove({data:data, fun:processPrey})
        };
    });
});

var hunterPos = [0,0];
var preyPos = [230,200];
var hunterDir = cardinalDirections.SE;

function stringFromValue(val){
  for(k in cardinalDirections){
    if(cardinalDirections[k] === val)
      return k;
  }
  return val;
}

function properWallOutput(walls){
  var clone = walls.slice(0);
  for(var i = 0; i < clone.length; i++){
    clone[i].direction = stringFromValue(clone[i].direction);
  }
  return clone;
}

function process(data, connection) {
    console.log("process");
    if (data.command == 'P') {
        connection.send(JSON.stringify({
                            command: data.command,
                            hunter: hunterPos,
                            prey: preyPos
                        }));
    }
    else if (data.command == 'W') {
        connection.send(JSON.stringify(
                            {
                                command: data.command,
                                walls: properWallOutput(walls)
                            }));
    }
}
function getProperDirection(direction){
  return cardinalDirections[direction];
}

var failDels = [];
function processHunter(data) {
        //{command:'B',wall: { length:<int>,direction:<cardinalDirections enum> }
        //{command:'D',wallIndex:<int>}
        //{command:'M'}
    console.log("processHunter");
    var validCommand = false;
    var properDirection = cardinalDirections.N;
    if (data.command == 'B') {
        // check if valid wall, right length, allowed to build wall (number and time)
        properDirection = getProperDirection(data.wall.direction);
        //console.log(properDirection);
        //console.log(properDirection);
        // data.wall.position = move(hunterPos,properDirection);
        var parsedWall = {};
        parsedWall.length = data.wall.length;
        parsedWall.position = hunterPos;
        parsedWall.direction = properDirection;

        //console.log("POSITION: " + data.wall.position);
        var valid = isValidWall(parsedWall, walls.concat(globalWalls), hunterPos, hunterDir, preyPos, data);
        if (valid) {
          var error;
          if(buildWallCoolingDown(time, timeSinceLastBuild, COOL_DOWN_TIME)) {
            error = new EvasionError("Wall could not be built.", errorCodes.WAIT_TIME, data);
            errorList.push(error);
          } else if(numWallsIsMaxed(MAX_WALLS,walls)){
            error = new EvasionError("Wall could not be built.", errorCodes.TOO_MANY_WALLS, data);
            errorList.push(error);
          } else {
	    parsedWall.id = lastWallId;
            walls.push(parsedWall);
            timeSinceLastBuild = time;
	    lastWallId++;
          }
        }
        validCommand = true;
    }
    else if (data.command == 'D') {
	failDels = [];
	data.wallIds.forEach(deleteWallsById);
        error = new EvasionError("Walls " + failDels + " do not exist", errorCodes.DELETE_FAILED, data);
	errorList.push(error);
        validCommand = true;
    }
    else if (data.command == 'M') {
        validCommand = true;
    }
    if (validCommand) {
        hunter = moveHunter(hunterPos,hunterDir,walls.concat(globalWalls));
        hunterPos = hunter.newPosition;
        hunterDir = hunter.direction;
    }
}


function deleteWallsById(currentValue) {
	var found = false;
	for (var i = 0; i < walls.length; i++) {
		if (wallEquals(currentValue,walls[i])) {
			walls.splice(i,1);
			found = true;
			break;
		}
	}
	if (!found) {
		failDels.push(currentValue);
	}
}

function wallEquals(id, wall) {
	return id == wall.id;
}

function processPrey(data) {
    //{command:'M',direction: :<cardinalDirections enum>}
    //{command:'P'}
    //{command:'W'}
    console.log("processPrey");
    var properDirection = cardinalDirections.N;
    if (data.command == 'M') {
        properDirection = getProperDirection(data.direction);
        if(properDirection != null)
          preyPos = movePrey(preyPos,properDirection,walls.concat(globalWalls));
    }
}

var hNextMove = null;
var pNextMove = null;
var hMoves = [];
var pMoves = [];

function sendMove(nextMove) {
    console.log("sendMove");
    hNextMove = null;
    pNextMove = null;

    if (nextMove.fun == processHunter) {
        hMoves.push(nextMove);
    }
    else if (nextMove.fun == processPrey){
        pMoves.push(nextMove);
    }
    //moves.push(nextMove);
    //console.log(moves);
    var broadcast;
    if (time%2 == 0) {
        //console.log("Even Time: " + time);
        if (hMoves.length != 0) {
            hNextMove = hMoves[0];
            hMoves.splice(0,1);
            hNextMove.fun(hNextMove.data);
            time++;
            broadcast = broadcastJson();
            publish(broadcast);
        }
    }
    else if (time%2 == 1) {
        //console.log("Odd Time: " + time);
        if (hMoves.length != 0 && pMoves.length != 0) {
            hNextMove = hMoves[0];
            pNextMove = pMoves[0];
            hNextMove.fun(hNextMove.data);
            pNextMove.fun(pNextMove.data);
            hMoves.splice(0,1);
            pMoves.splice(0,1);
            time++;
            broadcast = broadcastJson();
            publish(broadcast);
        }
    }
}

function broadcastJson(){
  var json = {};
  json.hunter = hunterPos;
  json.prey = preyPos;
  json.walls = properWallOutput(walls);
  json.time = time;
  json.gameover = hasHunterWon(hunterPos, preyPos, walls);
  json.errors = errorList;
  errorList = [];
  return JSON.stringify(json);
}



isPointOnWall = function(p, w) {
  switch (w.direction) {
    case cardinalDirections.E:
      return w.position[1] === p[1] && w.position[0] <= p[0] && w.position[0] + w.length >= p[0];
    case cardinalDirections.W:
      return w.position[1] === p[1] && w.position[0] >= p[0] && w.position[0] - w.length <= p[0];
    case cardinalDirections.S:
      return w.position[0] === p[0] && w.position[1] <= p[1] && w.position[1] + w.length >= p[1];
    case cardinalDirections.N:
      return w.position[0] === p[0] && w.position[1] >= p[1] && w.position[1] - w.length <= p[1];
    default:
      return false;
  }
};

move = function(oldPosition, cardinalDirection) {
  return [oldPosition[0] + cardinalDirection[0], oldPosition[1] + cardinalDirection[1]];
};

getCardinalDirection = function(raw) {
  var key, ret, value;
  ret = null;
  for (key in cardinalDirections) {
    value = cardinalDirections[key];
    if (value[0] === raw[0] && value[1] === raw[1]) {
      ret = cardinalDirections[key];
    }
  }
  return ret;
};

moveHunter = function(p, cardinalDirection, walls, depth, original1, original2) {
  var i, len, newDir, newPosition, returnVal, w;
  if (depth == null) {
    depth = 10;
  }
  if (original1 == null) {
    original1 = 0;
  }
  if (original2 == null) {
    original2 = 0;
  }
  returnVal = {
    newPosition: p,
    direction: cardinalDirection
  };
  if(cardinalDirection == null){
    newDir = [original1 * -1, original2 * -1];
    newDir = getCardinalDirection(newDir);
    returnVal.direction = newDir;
    return returnVal;
  }

  newPosition = move(p, cardinalDirection);

  if (depth === 0) {
    returnVal = {
      newPosition: p,
      direction: cardinalDirection
    };
    return returnVal;
  }
  for (i = 0, len = walls.length; i < len; i++) {
    w = walls[i];
    if (isPointOnWall(newPosition, w)) {
      if (w.direction === cardinalDirections.E || w.direction === cardinalDirections.W) {
        if (cardinalDirection === cardinalDirections.E || cardinalDirection === cardinalDirections.W) {
          return moveHunter(p, getCardinalDirection([cardinalDirection[0] * -1, 0]), walls, depth - 1, cardinalDirection[0], original2 );
        } else  {
          return moveHunter(p, getCardinalDirection([cardinalDirection[0], 0]), walls, depth - 1, original1, cardinalDirection[1]);
        }
      }
      if (w.direction === cardinalDirections.N || w.direction === cardinalDirections.S) {
        if (cardinalDirection === cardinalDirections.N || cardinalDirection === cardinalDirections.S) {
          return moveHunter(p, getCardinalDirection([0, cardinalDirection[1] * -1]), walls, depth - 1, original1 , cardinalDirection[1]);
        } else {
          return moveHunter(p, getCardinalDirection([0, cardinalDirection[1]]), walls, depth - 1, cardinalDirection[0], original2 );
        }
      }
    } else {
      newDir = [cardinalDirection[0], cardinalDirection[1]];
      if (original1 !== 0) {
        newDir[0] = original1 * -1;
      }
      if (original2 !== 0) {
        newDir[1] = original2 * -1;
      }
      newDir = getCardinalDirection(newDir);
      returnVal = {
        newPosition: newPosition,
        direction: newDir
      };
    }
  }
  return returnVal;
};

movePrey = function(position, cardDir, walls) {
  var i, len, n, w;
  n = move(position, cardDir);
  for (i = 0, len = walls.length; i < len; i++) {
    w = walls[i];
  }
  for (i = 0, len = walls.length; i < len; i++) {
    w = walls[i];
    if (isPointOnWall(n, w)) {
      return position;
    }
  }
  return n;
};

function RotationDirection(p1x, p1y, p2x, p2y, p3x, p3y) {
  if (((p3y - p1y) * (p2x - p1x)) > ((p2y - p1y) * (p3x - p1x)))
    return 1;
  else if (((p3y - p1y) * (p2x - p1x)) == ((p2y - p1y) * (p3x - p1x)))
    return 0;

  return -1;
}

line_intersects = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  if(x1 === x2 && y1 === y2 && x3 === x4 && y3 === y4){
      return x1 === x3 && y1 === y3;
  }
  var face1CounterClockwise = RotationDirection(x1, y1, x2, y2, x4, y4);
  var face2CounterClockwise = RotationDirection(x1, y1, x2, y2, x3, y3);
  var face3CounterClockwise = RotationDirection(x1, y1, x3, y3, x4, y4);
  var face4CounterClockwise = RotationDirection(x2, y2, x3, y3, x4, y4);

  // If face 1 and face 2 rotate different directions and face 3 and face 4 rotate different directions,
  // then the lines intersect.
  var intersect = face1CounterClockwise != face2CounterClockwise && face3CounterClockwise != face4CounterClockwise;

  // If lines are on top of each other.
  if (face1CounterClockwise == 0 && face2CounterClockwise == 0 && face3CounterClockwise == 0 && face4CounterClockwise == 0){
    intersect = true;}
    return intersect;
};

useCoords = function(wall) {
  var x1, x2, y1, y2;
  x1 = wall.position[0];
  y1 = wall.position[1];
  x2 = wall.position[0];
  y2 = wall.position[1];
  if (wall.direction === cardinalDirections.E) {
    x2 = x1 + wall.length;
  }
  if (wall.direction === cardinalDirections.W) {
    x2 = x1 - wall.length;
  }
  if (wall.direction === cardinalDirections.N ) {
    y2 = y1 - wall.length;
  }
  if (wall.direction === cardinalDirections.S) {
    y2 = y1 + wall.length;
  }
  return [x1, y1, x2, y2];
};

useLines = function(w1, w2) {
  var line1, line2;
  line1 = useCoords(w1);
  line2 = useCoords(w2);
  return line_intersects(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1], line2[2], line2[3]);
};

compareToPoint = function(w1, w2) {
  var line1;
  line1 = useCoords(w1);
  //console.log(line1[0], line1[1], line1[2], line1[3], w2[0], w2[1], w2[0], w2[1]);
  return line_intersects(line1[0], line1[1], line1[2], line1[3], w2[0], w2[1], w2[0], w2[1]);
};

isWallIntersecting = function(newWall, walls) {
  var i, len, wall;
  for (i = 0, len = walls.length; i < len; i++) {
    wall = walls[i];
    if (useLines(newWall, wall)) {
      return true;
    }
  }
  return false;
};

isWallIntersectingHunter = function(newWall, hunterPosition) {
  var wall = {};
  wall.length = newWall.length;
  wall.position = move(hunterPosition, newWall.direction);
  wall.direction = newWall.direction;
  return isPointOnWall(hunterPosition,wall);
};

isWallIntersectingPrey = function(newWall, preyPosition) {
  return isPointOnWall(preyPosition, newWall);
};

isSquished = function(hunterPos, hunterDir, walls) {
  var newPos, newerPos, evenNewerPos;

  newPos = moveHunter(hunterPos, hunterDir, walls);
  newerPos = moveHunter(newPos.newPosition, newPos.direction, walls);
  evenNewerPos = moveHunter(newerPos.newPosition, newerPos.direction, walls);
  if(newPos.newPosition[0] == newerPos.newPosition[0] &&
     newPos.newPosition[1] == newerPos.newPosition[1] &&
     evenNewerPos.newPosition[0] == newerPos.newPosition[0] &&
     evenNewerPos.newPosition[1] == newerPos.newPosition[1]  )
    return true;
  return false;
};

willWallCauseSquishing = function(newWall, walls, hunterPosition, hunterDir) {
  var newPosWOWall, ret;
  newPosWOWall = moveHunter(hunterPosition, hunterDir, walls);
  ret = isPointOnWall(newPosWOWall.newPosition,newWall);
  return ret || isSquished(hunterPosition, hunterDir, walls.concat(newWall));
};

hasHunterWon = function(hunterPos, preyPos, walls) {
  var closeEnough, i, len, line2, n, points, sum, wall;
  sum = 0;
  n = 0;
  while (n < hunterPos.length) {
    sum += Math.pow(hunterPos[n] - preyPos[n], 2);
    n++;
  }
  closeEnough = Math.floor(Math.sqrt(sum)) <= 4;
  for (i = 0, len = walls.length; i < len; i++) {
    wall = walls[i];
    line2 = useCoords(wall);
    if (line_intersects(hunterPos[0], hunterPos[1], preyPos[0], preyPos[1], line2[0], line2[1], line2[2], line2[3])) {
      return false;
    }
  }
  return closeEnough;
};


numWallsIsMaxed = function(num, walls) {
  return num === walls.length;
};

buildWallCoolingDown = function(timenow, timesincelast, waittime) {
  return timenow - timesincelast < waittime;
};

isValidWall = function(newWall, walls, hunterPos, hunterDir, preyPos, data) {
  if(data == null){
    data = "";
  }
  var error;
  var intersecthunter, intersectprey, intersectwall, squishing;
  intersectwall = isWallIntersecting(newWall, walls);
  if(intersectwall){
    error = new EvasionError("Wall could not be built", errorCodes.I_WALL, data);
    errorList.push(error);
  }
  intersecthunter = isWallIntersectingHunter(newWall, hunterPos);
  if(intersecthunter){
    error = new EvasionError("Wall could not be built", errorCodes.I_HUNT, data);
    errorList.push(error);
  }
  intersectprey = isWallIntersectingPrey(newWall, preyPos);
  if(intersectprey){
    error = new EvasionError("Wall could not be built", errorCodes.I_PREY, data);
    errorList.push(error);
  }
  squishing = willWallCauseSquishing(newWall, walls, hunterPos, hunterDir);
  if(squishing){
    error = new EvasionError("Wall could not be built", errorCodes.SQUISH, data);
    errorList.push(error);
  }
    return !(intersectwall || intersecthunter || intersectprey || squishing);
};

/*
processHunter({command:"B",wall:{length:2,direction:"S"}});
console.log(walls);
processHunter({command:"D",wallIds:[0]});
console.log(failDels);
console.log(walls);
processHunter({command:"D",wallIds:[0]});
console.log(failDels);
buildFakeWalls(5, 10);
processHunter({command:"D",wallIds:[2,4]});
console.log(walls);
buildFakeWalls(2, 60);
console.log(walls);

function buildFakeWalls(numWalls, seed) {
	for (var i = 0; i <= numWalls; i++) {
		hunterPos = [seed*i,seed*i];
		time = seed*i;
		processHunter({command:"B",wall:{length:i,direction:"S"}});
	}
}*/

/*processHunter({command:'B',wall: { position:[2,2], length:2, direction:cardinalDirections.S } });
console.log(walls);
console.log(moveHunter(hunterPos, hunterDir, walls));
console.log(movePrey(preyPos, cardinalDirections.NE, walls));*/

//sendMove({data: (hunterPos, hunterDir) ,fun:moveHunter});
//var socketH = new WebSocket('ws://localhost:1991');
//socketH.send({command:'P'});
