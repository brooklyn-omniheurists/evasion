# Application interface
## ws:localhost:1991 (Hunter's Port)
### Building walls
__Consumes__
```javascript
 {
   command:'B',
   wall: {
     length: INTEGER_VALUE,
     direction: <i.e. cardinalDirections.N>
   }
  }
```
### Deleting walls
__Consumes__
```javascript
{
    command: 'D',
    wallIndex: <int>
  }
```
### Moving w/o Building or Deleting Walls
__Consumes__
```javascript
  {
    command:'M'
  }
```

## ws:localhost:1992 (Prey's Port)
### Moving
__Consumes__
```javascript
{
  command: 'M',
  direction: <i.e cardinalDirections.N>
}
### Not Moving
__Consumes__
```javascript
{
  command: 'M'
}
```
##Both Hunter's and Prey's Port

### Get Positions of Hunter and Prey
__Consumes__
```javascript
{
  command: "P"
}
```
__Produces__
```javascript
{
  "command" : "P",
  "hunter" : [0,0],
  "prey": [230,200]
}
```
Get Walls
__Consumes__
```javascript
{
  command: "W"
}
```
__Produces__
```javascript
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
