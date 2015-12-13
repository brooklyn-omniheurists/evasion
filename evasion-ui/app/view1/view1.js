'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope',function($scope) {

  window.requestAnimFrame = (function(callback){
  return window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback){
    window.setTimeout(callback(), 1000 / 60);
  };
})();

  var MAX_WALLS = 7;
  var COOL_DOWN_TIME = 20;

  var WIDTH, HEIGHT, UNIT_SIZE;
  var hunter_pos, prey_pos, hunter_dir, time_since_last_wall;
  var tick = 0;
  var walls = []; $scope.walls = walls;
  var addend = 1;
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
  var Wall;

  function Wall(position, length, direction, id, path) {
    return {
      position: position,
      length: length,
      direction: direction,
      id: id,
      path: path
      //color: "red",
    }
  }

  function has_hunter_won(hunterPos, preyPos, walls) {
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


    var leftWall = new Wall([-1, -1], 302, cardinalDirections.S);
    var rightWall = new Wall([301, -1], 302, cardinalDirections.S);
    var topWall = new Wall([0, -1], 300, cardinalDirections.E);
    var bottomWall = new Wall([0, 301], 300, cardinalDirections.E);
    var globalWalls = [leftWall, rightWall, topWall, bottomWall];
    function move(oldPosition, cardinalDirection) {
    return [oldPosition[0] + cardinalDirection[0], oldPosition[1] + cardinalDirection[1]];
  };

  function isPointOnWall(p, w) {
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

  function getCardinalDirection(raw) {
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

  function moveHunter(p, cardinalDirection, walls, depth, original1, original2) {
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


  function easternPoint(pos,walls){
    var x_val = pos[0];
    var y_val = pos[1];
    var newPoint = [301, y_val];
    for(var i = 0; i < walls.length; i++){
      if(isPointOnWall([walls[i].position[0], y_val], walls[i])){
        if(newPoint[0] >= walls[i].position[0] && walls[i].position[0] > x_val)
          if(walls[i].direction == cardinalDirections.W)
            newPoint = [walls[i].position[0] - walls[i].length, y_val];
          else
            newPoint = [walls[i].position[0], y_val];
      }
    }
    return newPoint;
  }

  function westernPoint(pos,walls){
    var x_val = pos[0];
    var y_val = pos[1];
    var newPoint = [-1, y_val];
    for(var i = 0; i < walls.length; i++){
      if(isPointOnWall([walls[i].position[0], y_val], walls[i])){
        if(newPoint[0] <= walls[i].position[0] && walls[i].position[0] < x_val)
          if(walls[i].direction == cardinalDirections.E)
            newPoint = [walls[i].position[0] + walls[i].length, y_val];
          else
            newPoint = [walls[i].position[0], y_val];
      }
    }
    return newPoint;
  }

  function northernPoint(pos,walls){
    var x_val = pos[0];
    var y_val = pos[1];
    var newPoint = [x_val, -1];
    for(var i = 0; i < walls.length; i++){
      if(isPointOnWall([x_val, walls[i].position[1]], walls[i])){
        if(newPoint[1] <= walls[i].position[1] && walls[i].position[1] < y_val)
          if(walls[i].direction == cardinalDirections.S)
            newPoint = [x_val, walls[i].position[1] + walls[i].length];
          else
            newPoint = [x_val, walls[i].position[1]];
      }
    }
    return newPoint;
  }

  function southernPoint(pos,walls){
    var x_val = pos[0];
    var y_val = pos[1];
    var newPoint = [x_val, 301];
    for(var i = 0; i < walls.length; i++){
      if(isPointOnWall([x_val, walls[i].position[1]], walls[i])){
        if(newPoint[1] >= walls[i].position[1] && walls[i].position[1] > y_val)
          if(walls[i].direction == cardinalDirections.N)
            newPoint = [x_val, walls[i].position[1] - walls[i].length];
          else
            newPoint = [x_val, walls[i].position[1]];
      }
    }
    return newPoint;
  }

  function useLines(w1, w2) {
    var line1, line2;
    line1 = useCoords(w1);
    line2 = useCoords(w2);
    return line_intersects(line1[0], line1[1], line1[2], line1[3], line2[0], line2[1], line2[2], line2[3]);
  };

  function RotationDirection(p1x, p1y, p2x, p2y, p3x, p3y) {
    if (((p3y - p1y) * (p2x - p1x)) > ((p2y - p1y) * (p3x - p1x)))
      return 1;
    else if (((p3y - p1y) * (p2x - p1x)) == ((p2y - p1y) * (p3x - p1x)))
      return 0;

    return -1;
  }

  function line_intersects(x1, y1, x2, y2, x3, y3, x4, y4) {
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

  function useCoords(wall) {
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

  function generateVerticalWall(pos, walls){
    var northPoint = northernPoint(pos, walls);
    var southPoint = southernPoint(pos, walls);
    northPoint[1] = northPoint[1]+1;
    southPoint[1] = southPoint[1]-1;
    var length = southPoint[1] - northPoint[1];
    var out = new Wall(northPoint, length, cardinalDirections.S);
    return out;
  }

  function generateHorizontalWall(pos, walls){
    var eastPoint = easternPoint(pos, walls);
    var westPoint = westernPoint(pos, walls);
    eastPoint[0] = eastPoint[0]-1;
    westPoint[0] = westPoint[0]+1;
    var length = eastPoint[0] - westPoint[0];
    var out = new Wall(westPoint, length, cardinalDirections.E);
    return out;
  }

  function isSquished(hunterPos, hunterDir, walls) {
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

  function willWallCauseSquishing(newWall, walls, hunterPosition, hunterDir) {
    var newPosWOWall, ret;
    newPosWOWall = moveHunter(hunterPosition, hunterDir, walls);
    ret = isPointOnWall(newPosWOWall.newPosition,newWall);
    return ret || isSquished(hunterPosition, hunterDir, walls.concat(newWall));
  };

  function isWallIntersectingPrey(newWall, preyPosition) {
    return isPointOnWall(preyPosition, newWall);
  };


  function isWallIntersecting(newWall, walls) {
    var i, len, wall;
    for (i = 0, len = walls.length; i < len; i++) {
      wall = walls[i];
      if (useLines(newWall, wall)) {
        return true;
      }
    }
    return false;
  };

  function isWallIntersectingHunter(newWall, hunterPosition) {
    var wall = {};
    wall.length = newWall.length;
    wall.position = move(hunterPosition, newWall.direction);
    wall.direction = newWall.direction;
    return isPointOnWall(hunterPosition,wall);
  };

  function isValidWall(newWall, walls, hunterPos, hunterDir, preyPos, data) {
    if(data == null){
      data = "";
    }
    var error;
    var intersecthunter, intersectprey, intersectwall, squishing;
    intersectwall = isWallIntersecting(newWall, walls);
    if(intersectwall){
      appendLog("Wall could not be built, intersects with wall");
    //   error = new EvasionError("Wall could not be built", errorCodes.I_WALL, data);
    //   errorList.push(error);
    }
    intersecthunter = isWallIntersectingHunter(newWall, hunterPos);
    if(intersecthunter){
      appendLog("Wall could not be built, intersects with hunter");
    //   error = new EvasionError("Wall could not be built", errorCodes.I_HUNT, data);
    //   errorList.push(error);
    }
    intersectprey = isWallIntersectingPrey(newWall, preyPos);
    if(intersectprey){
      appendLog("Wall could not be built, intersects with prey");
    //   error = new EvasionError("Wall could not be built", errorCodes.I_PREY, data);
    //   errorList.push(error);
    }
    squishing = willWallCauseSquishing(newWall, walls, hunterPos, hunterDir);
    if(squishing){
      appendLog("Wall could not be built, wills squish you");
    //   error = new EvasionError("Wall could not be built", errorCodes.SQUISH, data);
    //   errorList.push(error);
    }
    // console.log(intersectwall , intersecthunter , intersectprey , squishing);
      return !(intersectwall || intersecthunter || intersectprey || squishing);
  };

  function movePrey(position, cardDir, walls) {
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

  function has_wall_limited_exceeded(){
    var exceeded =  walls.length >= MAX_WALLS;
    if(exceeded){
      appendLog("You've built too many walls. Max is " + MAX_WALLS);
    }
    return exceeded;
  }

  function gotta_wait(){
    var waiting = tick - time_since_last_wall < COOL_DOWN_TIME;
    if(waiting){
      appendLog("Too hasty. Must wait " + COOL_DOWN_TIME + " steps before building a wall.");
    }
    return waiting;
  }

  function cant_build_wall(){
    return has_wall_limited_exceeded() || gotta_wait();
  }

function wallv(){
  if(cant_build_wall())
    return;
  var newWall = generateVerticalWall(playerPos, walls);
  if (isValidWall(newWall, walls.concat(globalWalls), playerPos, hunter_dir, playerPos2)){
    // walls.push(newWall);
    time_since_last_wall = tick;
    vertWall(newWall);
  }
  return false;
}

function wallh(){
  if(cant_build_wall())
    return;
  var newWall = generateHorizontalWall(playerPos, walls);

  if (isValidWall(newWall, walls.concat(globalWalls), playerPos, hunter_dir, playerPos2)){
    // walls.push(newWall);
    time_since_last_wall = tick;
    horWall(newWall);
  }
  return false;
}

function deleteWallById(currentValue) {
	var found = false;
	for (var i = 0; i < walls.length; i++) {
		if (wallEquals(currentValue,walls[i])) {
            freeColor(walls[i]);
            walls[i].path.remove();
			walls.splice(i,1);
			found = true;
			break;
		}
	}
	if (!found) {
        console.log("error");
	}
}

function wallEquals(id, wall) {
	return id == wall.id;
}

















var left_key_down = false;
var right_key_down = false;
var up_key_down = false;
var down_key_down = false;
var direction;
var prey_direction = null;
var block_send = false;

Mousetrap.bind('up', function() {
  prey_direction = cardinalDirections.N;
  if(left_key_down === true)
    prey_direction = cardinalDirections.NW;
  if(right_key_down === true)
    prey_direction = cardinalDirections.NE;
  up_key_down = true;
  return false;
}, 'keydown');
Mousetrap.bind('up', function() {
  up_key_down = false;
}, 'keyup');

Mousetrap.bind('down', function() {
  prey_direction = cardinalDirections.S;
  if(left_key_down === true)
    prey_direction = cardinalDirections.SW;
  if(right_key_down === true)
    prey_direction = cardinalDirections.SE;
  down_key_down = true
  return false;
}, 'keydown');
Mousetrap.bind('down', function() {
  down_key_down = false;
}, 'keyup');

Mousetrap.bind('left', function() {
  prey_direction = cardinalDirections.W;
  if(up_key_down === true)
    prey_direction =  cardinalDirections.NW;
  if(down_key_down === true)
    prey_direction = cardinalDirections.SW;
  left_key_down = true;
  return false;
}, 'keydown');
Mousetrap.bind('left', function() {
  left_key_down = false;
}, 'keyup');

Mousetrap.bind('right', function() {
  prey_direction = cardinalDirections.E;
  if(up_key_down === true)
    prey_direction = cardinalDirections.NE;
  if(down_key_down === true)
    prey_direction =  cardinalDirections.SE;
  right_key_down = true;
  return false;
}, 'keydown');
Mousetrap.bind('right', function() {
  right_key_down = false;
}, 'keyup');








    var playerPos=[0,0];
    var playerPos2=[230,200];
    var wallIds =  {};
    //var walls = [];
    var gameRunning = true;
    $scope.SCORE = 0;

    // Drawing walls to be deleted    
    $scope.colors = [];
    var rawColors = randomColor({
                   count: 10
                });
    rawColors.forEach(function(item) { $scope.colors.push({color: item, isAvailable: true}) });
    function useColor(wall) {
        for (var i = 0; i < $scope.colors.length; i++) {
            if ($scope.colors[i].isAvailable) {
                wall.id = i;
                wall.path.attr({
                    "stroke": $scope.colors[i].color
                });
                $scope.colors[i].isAvailable = false;
                break;
            }
        }
    }
    function freeColor(wall) {
        $scope.colors[wall.id].isAvailable = true;
    }
    //$scope.existingColors = [];
    function bindNumbers () {
        for (var i = 0; i < 10; i++) {
            Mousetrap.bind(i.toString(), function(e, i) {
                deleteWallById(i);
            }, 'keyup');
        }
    }
    bindNumbers();
    
    function vertWall (wall) {
        console.log("vertWall");
        if (wall.direction == cardinalDirections.S) {
            var oldX = wall.position[0] * UNIT_SIZE;
            var oldY = wall.position[1] * UNIT_SIZE;
            var finalX = oldX;
            var finalY = oldY + wall.length*UNIT_SIZE;
            wall.path = map.path('M' + oldX + ',' + oldY + ' L' + finalX + ',' + finalY);
            useColor(wall);
            //tempP.build = 0;
            //tempP.id = wall.id;
            walls.push(wall);
            //$scope.existingColors.push({id:wall.id%$scope.colors.length, color:$scope.colors[wall.id%$scope.colors.length]})
        }
    }
    function horWall (wall) {
        console.log("horWall");
        console.log(wall);
        if (wall.direction == cardinalDirections.E) {
            var oldX = wall.position[0] * UNIT_SIZE;
            var oldY = wall.position[1] * UNIT_SIZE;
            var finalX = oldX + wall.length*UNIT_SIZE;
            var finalY = oldY;
            wall.path  = map.path('M' + oldX + ',' + oldY + ' L' + finalX + ',' + finalY);
            useColor(wall);
            //tempP.build = 0;
            //tempP.id = wall.id;
            walls.push(wall);
        }
    }

    var arenaSize = 300;
    var UNIT_SIZE = 1.5;
    var playerDir=pi/4;
    var samples=200;
    var pi=Math.PI;
    var face = [];
    var mapball = null;
    var mapball2 = null;

    var theMap = document.getElementById("map");
    var log = document.getElementById('text_area');
    var dimension = arenaSize*UNIT_SIZE;
    var map=Raphael(theMap,dimension,dimension);
    var arena=initArena(arenaSize,arenaSize);
    initUnderMap();
    drawCanvas();
    hunter_dir = cardinalDirections.SE;

    log.style.width = arenaSize * UNIT_SIZE + 6+ "px";
    log.value = "Welcome.";

    function appendLog(string){
      var last = log.value;
      last = last + "\n";
      log.value = last + string;
      log.scrollTop = log.scrollHeight;
    }

    function update(){
      var hunter = moveHunter(playerPos, hunter_dir, walls.concat(globalWalls));
      var won = has_hunter_won(playerPos, playerPos2, walls);
      if(won){
        appendLog("Hunter has won! Took " + tick + " steps.");
        anim_loop = null;
        return;
      }
      playerPos = hunter.newPosition;
      hunter_dir = hunter.direction;
      tick = tick + 1;
      if(tick % 2 === 0 && prey_direction !== null){
        playerPos2 = movePrey(playerPos2,getCardinalDirection(prey_direction),walls.concat(globalWalls));
        prey_direction = null;
      }
      $scope.SCORE = tick;
	    $scope.$apply();
    }



    $scope.arenaSize=arenaSize;
    $scope.UNIT_SIZE = UNIT_SIZE;
    $scope.dimension = dimension;

    function initArena(arenaWidth,arenaLength) {
        var arena=[];
        for (var i=0; i<arenaWidth; i++) {
            arena[i] = [];
            for (var j=0; j<arenaLength; j++) {
                arena[i][j] = 1;
                if (i==0 || i==(arenaWidth-1)) {arena[i][j]=2;}
                if (j==0 || j==(arenaLength-1)) {arena[i][j]=2;}
            }
        }

        var cellStack = [];
        var currCell = [0,0];
        var currX = currCell[0];
        var currY = currCell[1];
        for (var i = 1; i < arenaWidth-1; i++) {
            for (var j = 1; j < arenaLength-1; j++) {
                currCell = [i,j];
                currX = currCell[0];
                currY = currCell[1];
                arena[currX][currY] = 0;
                cellStack.push(currCell);
            }
        }

        var anim_loop = (function() {
          update();
          drawCanvas();
          requestAnimFrame(anim_loop);
        });
        requestAnimFrame(anim_loop);
        return arena;
    }

    function initUnderMap(){
        var ulen = arena.length;
        var uwid = arena[0].length;
        map.rect(0,0, uwid*UNIT_SIZE, ulen*UNIT_SIZE).attr({fill:"#FFF", stroke:"#fff"});
        for (var i=0; i<uwid; i++) {
            for (var j=0; j<ulen; j++) {
                var i8 = i*UNIT_SIZE;
                var j8 = j*UNIT_SIZE;
                if (arena[i][j]==1) { map.rect(i8,j8, UNIT_SIZE,UNIT_SIZE).attr({fill:"#444", stroke:"#444"}); }
            }
        }
    }

    function drawCanvas(){

        var bSize = 4*UNIT_SIZE;
        if (!mapball && !mapball2) {
            mapball = map.circle(playerPos[0]*UNIT_SIZE, playerPos[1]*UNIT_SIZE, bSize/2).attr({fill:"#36c", stroke: "none"});
            mapball2 = map.circle(playerPos2[0]*UNIT_SIZE, playerPos2[1]*UNIT_SIZE, bSize/2).attr({fill:"green", stroke: "none"});
        } else {
            mapball.attr({
                cx: playerPos[0] * UNIT_SIZE,
                cy: playerPos[1] * UNIT_SIZE
            });
	    mapball2.attr({
                cx: playerPos2[0] * UNIT_SIZE,
                cy: playerPos2[1] * UNIT_SIZE
            });
        }
    }

    Mousetrap.bind('h', wallh);
    Mousetrap.bind('v', wallv);

}]);
