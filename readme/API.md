# Application interface
## ws:localhost:1991 (Hunter's Port)
Building walls
```javascript
 {
   command:'B',
   wall: {
     length: INTEGER_VALUE,
     direction: <i.e. cardinalDirections.N>
   }
  }
```
Deleting walls
```javascript
{
    command: 'D',
    wallIndex: <int>
  }
```
Just moving
```javascript
  {
    command:'M'
  }
```

## ws:localhost:1992 (Prey's Port)
```javascript
{
  command: 'M',
  direction: <i.e cardinalDirections.N>
}
```
##Both players can pass the following:

Get Positions of Hunter and Prey
```javascript
{
  command: "P"
}
```
Get Walls
```javascript
{
  command: "W"
}
```
