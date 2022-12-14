# [count.do](https://count.do)

A Globally-Distributed Counter API with Transactional Integrity

## API

<https://count.do/api/:key>

```json
{
  "key": ":key",
  "value": 1,
  "count": "https://count.do/api/:key",
  "read": "https://count.do/api/:key?value",
  "reset": "https://count.do/api/:key?reset"
}
```

## Options

- `?value` returns current value without incrementing counter
- `?reset` resets the counter to 0

## [🚀 We're hiring!](https://careers.do/apply)

[Driv.ly](https://driv.ly) is simple APIs to buy & sell cars online, funded by some of the [biggest names](https://twitter.com/TurnerNovak) in [automotive](https://fontinalis.com/team/#bill-ford) and [finance & insurance](https://www.detroit.vc)

We're building our entire infrastructure on Cloudflare Workers, Durable Objects, KV, R2, and PubSub.  If you're as passionate about these transformational technologies as we are, we'd love for you to join our rapidly-growing team.
