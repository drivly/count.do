# count.do
A Globally-Distributed Counter API with Transactional Integrity

## API 

<https://count.do/api/:key>

`:key` is any value

<https://count.do/api/🚀>
```
{
  "key": "🚀",
  "value": 1,
  "increment": "https://count.do/api/🚀",
  "read": "https://count.do/api/🚀?value",
  "reset": "https://count.do/api/🚀?reset"
}
```

## Options
- `?value` returns current value without incrementing counter
- `?reset` resets the counter to 0
