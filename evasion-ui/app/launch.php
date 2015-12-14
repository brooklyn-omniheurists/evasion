<!DOCTYPE html>
<!--[if lt IE 7]>      <html lang="en" ng-app="myApp" class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html lang="en" ng-app="myApp" class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html lang="en" ng-app="myApp" class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html lang="en" ng-app="myApp" class="no-js"> <!--<![endif]-->
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="description" content="">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="bower_components/html5-boilerplate/dist/css/normalize.css">
  <link rel="stylesheet" href="bower_components/html5-boilerplate/dist/css/main.css">
  <link rel="stylesheet" href="../node_modules/bootstrap/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="app.css">
  <script src="bower_components/html5-boilerplate/dist/js/vendor/modernizr-2.8.3.min.js"></script>


  <title>Dr Ecco</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <link rel="stylesheet" type="text/css" href="../../style.css" media="screen" />

</head>
<body>


  <div class="post">
      <h1 class="title">Evasion V3</h1>
  </div>
  <div >
      <div class="instr">
          <p>
          <b>Instructions:</b> <br />
          The gravity game is a two players game. One player (the Hider) puts two black holes in the gravitational field while the other
          (the Seeker) can fire 5 shots with a missile and has to get the closest possible to the planet Earth.
          </p>
      </div>
      <div class="instr">
          <b>Rules of the game:</b>
          <ul>
              <li><span style="color:red"> Rule #1: </span>Blah blah .</li>
              <li><span style="color:red"> Rule #2: </span>Blah blah .</li>
          </ul>
      </div>
      <div>
          <b>The object of the game is to ......</b>. The winner is the one who blah blah...
      </div>
  </div>

  <!--[if lt IE 7]>
      <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
  <![endif]-->

  <div ng-view id="gameArea">
  <!-- In production use:
  <script src="//ajax.googleapis.com/ajax/libs/angularjs/x.x.x/angular.min.js"></script>
  -->
  <script src="bower_components/angular/angular.js"></script>
  <script src="bower_components/angular-route/angular-route.js"></script>
  <script src="bower_components/raphael/raphael-min.js" type="text/javascript" charset="utf-8"></script>
  <script src="../node_modules/mousetrap/mousetrap.min.js"></script>
  <script src="../node_modules/randomcolor/randomColor.js"></script>

  <script src="app.js"></script>
  <script src="view1/view1.js"></script>
  <script src="view2/view2.js"></script>
  <script src="components/version/version.js"></script>
  <script src="components/version/version-directive.js"></script>
  <script src="components/version/interpolate-filter.js"></script>

</div>

<div class="post" style="position:absolute; top:80%; height:10%">
<h2 class="title">Last 10 scores</h2>
<?php
  // functions.php in case of an opening in the same window
  // ../../functions.php in case of an opening in a new window
  include '../../lastScores.php';
  getScores("EvasionV3");
?>
</div>


</body>
</html>