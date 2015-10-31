# Evasion game

Evasion is a game played on a `300 x 300` grid. The hunter starts at `(0,0)` and the prey starts at `(230,200)`. The goal is for the hunter to catch the prey while playing within the constraints below.

__Catching__ the prey means getting within a euclidean distance of 4 from it, and not having any walls inbetween the two.

## Movement

### Hunter

The hunter moves once per step, and it can only move diagonally. He starts off moving `SOUTHEAST`, only changing direction after _bouncing_. The hunter has the ability to create and delete these walls at will, except for the walls at the borders.

### Prey

The prey moves once every other turn, and can move in any given direction, but only one unit of movement. Thus, it can go from any one `(x,y)` to any adjacent `(x,y)` coordinate. It can not cross walls, and if it hits a wall, it simply stays in place without "bouncing".

## Building Walls

Walls are centered about points on an `(x,y)` coordinate plane. they have a thickness of .5 and are always of integer length.

A hunter can only build a wall every N step, and have a maximum of M walls at any given moment. The hunter can always delete a wall whenever it wants however.

When a hunter builds a wall, it builds the wall at a point that touches the hunter, but not at the hunter. For example, a hunter at point `(10,10)` builds a wall that goes `SOUTH` of him, the wall starts at point `(10,11)` and moves southward. The same works for `NORTH`, `EAST`, and `WEST`, each one moving over one unit in the given direction.

__Diagonal walls are not supported.__


An illustration:
A hunter builds an eastward and a southward wall, then moves southeast with no problem.

![hunter-moving-southeast1](images/hunter-moving-southeast1.png)

![hunter-moving-southeast2](images/hunter-moving-southeast2.png)

## Bouncing

When a hunter hits a wall, it bounces off and changes direction. The walls are centered around integer coordinates, so the hunter can never intersect with that wall (can't occupy the same coordinates)! Instead, it 'bounces' off by shifting along the wall and reversing its direction perpendicular to the collided wall.

Example of bouncing off horizontal wall.

![hunter-bouncing-off-horizontal1-arrow](images/hunter-bouncing-off-horizontal1-arrow.png)

![hunter-bouncing-off-horizontal2-arrow](images/hunter-bouncing-off-horizontal2-arrow.png)

Example of bouncing off vertical wall.

![hunter-bouncing-off-vertical1-arrow](images/hunter-bouncing-off-vertical1-arrow.png)

![hunter-bouncing-off-vertical2-arrow](images/hunter-bouncing-off-vertical2-arrow.png)

Example of a corner bounce

![hunter-bouncing-off-corner1-arrow](images/hunter-bouncing-off-corner1-arrow.png)


![hunter-bouncing-off-corner2-arrow](images/hunter-bouncing-off-corner2-arrow.png)

## Application interface

Here is some insight as to the input and output (communication is all in JSON format):

Here is an enum for passing direction you want to move to (we are in the process of changing method to accept string instead of a value for this enum but is lower on priority list):

var cardinalDirections = {
    N: [0,1],
    S: [0,-1],
    E: [1,0],
    W: [-1,0],
    NE: [1,-1],
    NW: [-1,-1],
    SE: [1,1],
    SW: [-1,1]
};

The sample input for hunter are these JSON formatted commands sent to the webSocket:
 //For building walls
 {
   command:'B',
   wall: {
     length: INTEGER_VALUE,
     direction: <i.e. cardinalDirections.N>
   }
  }
  //For deleting walls
  {
    command: 'D',
    wallIndex: <int>
  }
  //For not doing anything (just moving)
  {
    command:'M'
  }

The sample input for prey socket are
{
  command: 'M',
  direction: <i.e cardinalDirections.N>
}

Both players can pass the following:
{
  command: "P"
}
this returns the positions of the hunter and the prey
{
  command: "W"
}
this returns the positions of the wall



Overall Architecture:

1 Web Socket that publishes a turn
1 Web Socket for Hunter to Communicate with Server
1 Web Socket for Prey to Communicate with Server

We are currently finishing up testing that moves are working as expected. We will publish the github url soon. There will be a html file for sample commands and soon after a java client to sample commands.

- Amir (Brooklyn)
