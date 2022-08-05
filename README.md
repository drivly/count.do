# count.do
A Globally-Distributed Counter API with Transactional Integrity

## API 

<https://count.do/api/:key>
```
{
  "key": ":key",
  "value": 1,
  "increment": "https://count.do/api/:key",
  "read": "https://count.do/api/:key?value",
  "reset": "https://count.do/api/:key?reset"
}
```

## Options
- `?value` returns current value without incrementing counter
- `?reset` resets the counter to 0
