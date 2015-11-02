# Application Interface
## ws:localhost:1990 (Publisher's Port)
### Publishes Turn Results
__Produces__
```json
 {
    "hunter": [1,1],
    "prey": [231,200],
    "walls": [
           {
             "length" : 4,
             "position": [1,0],
             "direction":"E"
           }, ...
          ],
    "time": 1,
    "gameover": false,
    "errors": [
      {
        "message" : "Wall could not be built",
        "code": 0,
        "reason" : "This wall intersects another wall",
        "data": {
          "command" : "B",
          "direction" : "N"
        }
      }...
    ]
}
```

__Both walls and errors can be empty__. The Errors object has a list of codes and it's meaningful reasons. The codes are provided for debugging sake.

```javascript
errorCodes[0] = "This wall intersects another wall";
errorCodes[1] = "This wall intersects the hunter";
errorCodes[2] = "This wall intersects the prey";
errorCodes[3] = "This wall causes squishing";
errorCodes[4] = "Not enough time has elapsed since last build";
errorCodes[5] = "You've built too many walls brother. Time to start thinking about tearing them down.";
errorCodes[6] = "These wall ids do not exist and therefore could not be deleted";
```

## ws:localhost:1991 (Hunter's Port)
### Building walls
__Consumes__
```json
 {
   "command":"B",
   "wall": {
     "length": 10,
     "direction": "N"
   }
  }
```
### Deleting walls (multiple walls now possible)
__Consumes__
```json
{
    "command": "D",
    "wallIds": [2,5]
 }
```
### Moving w/o Building or Deleting Walls
__Consumes__
```javascript
  {
    "command":"M"
  }
```

## ws:localhost:1992 (Prey's Port)
### Moving
__Consumes__
```json
{
  "command": "M",
  "direction": "NE"
}
```
### Not Moving
__Consumes__
```json
{
  "command": "M"
}
```
## Both Hunter's and Prey's Port

### Get Positions of Hunter and Prey
__Consumes__
```json
{
  "command": "P"
}
```
__Produces__
```json
{
  "command" : "P",
  "hunter" : [0,0],
  "prey": [230,200]
}
```
### Get Walls
__Consumes__
```json
{
  "command": "W"
}
```
__Produces__
```json
{
  "command" : "W",
  "walls" : [
     {
       "length" : 4,
       "position": [1,0],
       "direction":"E"
     }
  ]
}
```
