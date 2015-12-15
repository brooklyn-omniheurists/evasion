
'use strict';
angular
    .module('myApp.view1')
    .value("gameValues",{
        score: 0,
        playerPos:[0,0],
        playerPos2:[230,200],
        maxNumWalls: 5,
        coolDownTime : 20,
        hunterName:"",
        preyName:""
});
