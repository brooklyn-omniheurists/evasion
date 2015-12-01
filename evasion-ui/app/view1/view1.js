'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope',function($scope) {
    var playerPos=[0,0];
    var playerPos2=[230,200];
    var wallIds =  {};
    var walls = [];
    var gameRunning = true;
    var hunterDir = "SE";
    var audio = document.getElementById("myAudio");
    $scope.SCORE = 0;
    var pubSocket = new WebSocket('ws://localhost:1990');

    pubSocket.onopen = function (e) {
        console.log("OPEN");
    }

    pubSocket.onmessage = function (pubTurn) {
        //console.log(pubTurn.data);
        var turn = JSON.parse(pubTurn.data);
        if (turn.gameover && gameRunning) {
            window.alert("Hunter Won! Took " + turn.time);
            gameRunning = false;
        }
        if(turn.hunterDir !== hunterDir){
          hunterDir = turn.hunterDir;
          if(audio.paused){
            audio.play();
          } else {
            audio.currentTime = 0;
          }
        }
        playerPos = [ turn.hunter[0], turn.hunter[1] ];
        playerPos2 = [ turn.prey[0], turn.prey[1] ];
        for (var i = 0; i < turn.walls.length; i++) {
            var curWall = turn.walls[i];
            if (wallIds[curWall.id] == undefined ) {
                //var origin = curWall.position;
                wallIds[curWall.id] = walls.length; // make
                switch(curWall.direction) {
                    case "S": vertWall(curWall);
                        break;
                    case "E": horWall(curWall);
                        break;
                }
            }
            else {
                if (walls[wallIds[curWall.id]] != undefined) {
                    walls[wallIds[curWall.id]].build = 2; // keep
                }
                else {
                    console.log(wallIds[curWall.id]);
                }
            }

        }

        for (var i = 0; i < walls.length; i++) {
            var curWall = walls[i];
            if (curWall.build == 1) {
                curWall.hide();
                walls.splice(wallIds[curWall.id], 1);
                var id = null;
                for (id in wallIds) {
                    if (id > curWall.id) {
                        wallIds[id]--;
                    }
                }
                /*var origin = curWall.position;
                switch(curWall.direction) {
                    case "S": vertWall(origin[0],origin[1],curWall.direction,curWall.length,true);
                        break;
                    case "E": horWall(origin[0],origin[1],curWall.direction,curWall.length,true);
                        break;
                }
                wallIds[curWall.id] = undefined;*/
            }
            else {
                curWall.build = 1;
            }
        }

    //console.log(wallIds);
    $scope.SCORE = turn.time;
	$scope.$apply();
        drawCanvas();
    }

    function vertWall (wall) {//(oldX,oldY,dir,length,del) {
	/*if (dir == "N") {
		for (var i = oldX, j=oldY; j > oldY-length; j--) {
		    drawWall(i,j);
		}
	}*/
        console.log("vertWall");
        if (wall.direction == "S") {
            var oldX = wall.position[0];
            var oldY = wall.position[1];
            var finalX = oldX;
            var finalY = oldY + wall.length;
            var tempP = map.path('M' + oldX + ',' + oldY + ' L' + finalX + ',' + finalY);
            tempP.build = 0;
            tempP.id = wall.id;
            walls.push(tempP);
            /*
            for (var i = oldX, j=oldY; j <= oldY+length; j++) {
                drawWall(i,j,del);
            }*/
        }
    }
    function horWall (wall) {//(oldX,oldY,dir,length,del) {
        console.log("horWall");
        if (wall.direction == "E") {
            var oldX = wall.position[0];
            var oldY = wall.position[1];
            var finalX = oldX + wall.length;
            var finalY = oldY;
            var tempP = map.path('M' + oldX + ',' + oldY + ' L' + finalX + ',' + finalY);
            tempP.build = 0;
            tempP.id = wall.id;
            walls.push(tempP);
            /*
            for (var i = oldX, j=oldY; i <= oldX+length; i++) {
                drawWall(i,j,del);
            }*/
        }
        /*if (dir == "W") {
            for (var i = oldX, j=oldY; i > oldX-length; i--) {
                drawWall(i,j);
            }
        }*/
    }

    var arenaSize = 300;
    var UNIT_SIZE = 1;
    var playerDir=pi/4;
    var samples=200;
    var pi=Math.PI;
    var face = [];
    var mapball = null;
    var mapball2 = null;

    var theMap = document.getElementById("map");
    //var actualSize = arenaSize+2;
    var dimension = arenaSize*UNIT_SIZE;
    var map=Raphael(theMap,dimension,dimension);
    var arena=initArena(arenaSize,arenaSize);
    initUnderMap();
    drawCanvas();

    function drawWall(i, j, del) {
        //arena[i][j]=2;
        var color = "red";
        if (del) {
            color = "white";
        }
        var wallUnit = map.rect(i*UNIT_SIZE,j*UNIT_SIZE,UNIT_SIZE,UNIT_SIZE).attr({fill:color, stroke:color});
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
                //if (arena[i][j]==2) { map.rect(i8,j8, UNIT_SIZE,UNIT_SIZE).attr({fill:"#888", stroke:"#888"}); }
            }
        }
    }

    function drawCanvas(){

        var bSize = 4*UNIT_SIZE;
        if (!mapball && !mapball2) {
            // HUNTER
            mapball = map.circle(playerPos[0]*UNIT_SIZE, playerPos[1]*UNIT_SIZE, bSize/2).attr({fill:"#36c", stroke: "none"});
            // PREY
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

}]);
