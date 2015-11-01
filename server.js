var server = require('websocket').server, http = require('http');

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
var time = 0;

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



socket.on('request', function(request) {
    connection1 = request.accept(null, request.origin);

    connection1.on('message', function(message) {
        console.log("main socket");
    });

    connection1.on('close', function(connection) {
        console.log('connection closed');
        time = 0;
        hunterMoves = [];
        preysMoves = [];
    });
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
                                walls: walls
                            }));
    }
}
function getProperDirection(direction){
  return cardinalDirections[direction];
}

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
        data.wall.position = move(hunterPos,properDirection);
        //console.log("POSITION: " + data.wall.position);
        var valid =  isValidWall(data.wall, walls.concat(globalWalls), hunterPos, hunterDir, preyPos);
        if (valid) {
            walls.push(data.wall);
        }
        validCommand = true;
    }
    else if (data.command == 'D') {
        // check if valid deletion
        var valid = canDeleteWall(data.wallIndex,walls);
        //console.log("LOOK HERE" + valid);
        if (valid) {
            walls.splice(data.wallIndex);
        }
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

function processPrey(data) {
    //{command:'M',direction: :<cardinalDirections enum>}
    //{command:'P'}
    //{command:'W'}
    console.log("processPrey");
    var properDirection = cardinalDirections.N;
    if (data.command == 'M') {
        if (data.direction == null) {
            data.direction = [0,0];
        }

        properDirection = getProperDirection(data.direction);
     
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
    if (time%2 == 0) {
        //console.log("Even Time: " + time);
        if (hMoves.length != 0) {
            hNextMove = hMoves[0];
            hMoves.splice(0,1);
            hNextMove.fun(hNextMove.data);
            time++;
             connection1.send(JSON.stringify({
                        hunter: hunterPos,
                        prey: preyPos,
                        wall: walls,
                        time: time,
                        gameover: hasHunterWon(hunterPos, preyPos, walls)

                    }));
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
            //console.log("LOOK HERE: " + preyPos);
             connection1.send(JSON.stringify({
                        hunter: hunterPos,
                        prey: preyPos,
                        wall: walls,
                        time: time,
                        gameover: hasHunterWon(hunterPos, preyPos, walls)
                    }));
        }
    }
        //console.log(moves);


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
  newPosition = move(p, cardinalDirection);
  returnVal = {
    newPosition: p,
    direction: cardinalDirection
  };
  if (depth === 0) {
    return {
      newPosition: p,
      direction: cardinalDirection
    };
  }
  for (i = 0, len = walls.length; i < len; i++) {
    w = walls[i];
    if (isPointOnWall(newPosition, w)) {
      if (w.direction === cardinalDirections.E || w.direction === cardinalDirections.W) {
        if (cardinalDirection === cardinalDirections.E || cardinalDirection === cardinalDirections.W) {
          return moveHunter(p, getCardinalDirection([cardinalDirection[0] * -1, 0]), walls, depth - 1, cardinalDirection[0], original2 );
        } else  {
          return moveHunter(p, getCardinalDirection([cardinalDirection[0], cardinalDirection[1] * -1]), walls, depth - 1, original1, cardinalDirection[1]);
        }
      }
      if (w.direction === cardinalDirections.N || w.direction === cardinalDirections.S) {
        if (cardinalDirection === cardinalDirections.N || cardinalDirection === cardinalDirections.S) {
          return moveHunter(p, getCardinalDirection([0, cardinalDirection[1] * -1]), walls, depth - 1, original1 , cardinalDirection[1]);
        } else {
          return moveHunter(p, getCardinalDirection([cardinalDirection[0] *-1, cardinalDirection[1]]), walls, depth - 1, cardinalDirection[0], original2 );
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
  return isPointOnWall(hunterPosition,newWall);
};

isWallIntersectingPrey = function(newWall, preyPosition) {
  return isPointOnWall(preyPosition, newWall);
};

isSquished = function(hunterPos, hunterDir, walls) {
  var newPos;
  newPos = moveHunter(hunterPos, hunterDir, walls);
  return newPos.cardinalDirection === cardinalDirections.E || newPos.cardinalDirection === cardinalDirections.W || newPos.cardinalDirection === cardinalDirections.N || newPos.cardinalDirection === cardinalDirections.S;
};

willWallCauseSquishing = function(newWall, walls, hunterPosition, hunterDir) {
  return isSquished(hunterPosition, hunterDir, walls.concat(newWall));
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

canDeleteWall = function(index, walls) {
  return index >= 0 && index < walls.length;
};

numWallsIsMaxed = function(num, walls) {
  return num === walls.length;
};

buildWallCoolingDown = function(timenow, timesincelast, waittime) {
  return timenow - timesincelast < waittime;
};

isValidWall = function(newWall, walls, hunterPos, hunterDir, preyPos) {
  var intersecthunter, intersectprey, intersectwall, squishing;
  intersectwall = isWallIntersecting(newWall, walls);
   // console.log("MAYBE1: " + intersectwall);
  intersecthunter = isWallIntersectingHunter(newWall, hunterPos);
   //     console.log("MAYBE2: " + intersecthunter);

  intersectprey = isWallIntersectingPrey(newWall, preyPos);
  //      console.log("MAYBE3: " + intersectprey);

  squishing = willWallCauseSquishing(newWall, walls, hunterPos, hunterDir);
   //       console.log("MAYBE4: " + squishing);

    return !(intersectwall || intersecthunter || intersectprey || squishing);
};

/*processHunter({command:'B',wall: { position:[2,2], length:2, direction:cardinalDirections.S } });
console.log(walls);
console.log(moveHunter(hunterPos, hunterDir, walls));
console.log(movePrey(preyPos, cardinalDirections.NE, walls));*/

//sendMove({data: (hunterPos, hunterDir) ,fun:moveHunter});
//var socketH = new WebSocket('ws://localhost:1991');
//socketH.send({command:'P'});
