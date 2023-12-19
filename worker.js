export default {
  fetch: (req, env) => {
    const { hostname, pathname } = new URL(req.url)
    const name = hostname + pathname.replace(/^\/(api\/?)?/, '')
    const id = env.COUNTER.idFromName(name)
    const stub = env.COUNTER.get(id)
    return stub.fetch(req)
  },
}

export class Counter {
  constructor(state, _env) {
    this.state = state
    this.state.blockConcurrencyWhile(async () => {
      this.value = (await this.state.storage.get('value')) || 0
      this.setCount = (await this.state.storage.get('setCount')) || 1
      this.repeat = (await this.state.storage.get('repeat')) || true
      this.callback = (await this.state.storage.get('callback')) || null
    })
  }

  async fetch(req) {
    const { origin, pathname, searchParams } = new URL(req.url)
    if (req.method === 'POST') {
      const { setCount, repeat, callback } = await req.json()
      if (setCount !== undefined) this.setCount = Math.max(setCount, 1)
      if (repeat !== undefined) this.repeat = repeat ? true : false
      if (callback !== undefined) this.callback = callback
      await this.state.storage.put('setCount', this.setCount)
      await this.state.storage.put('repeat', this.repeat)
      await this.state.storage.put('callback', this.callback)
    }
    if (searchParams.has('setCount')) {
      this.setCount = Math.max(parseInt(searchParams.get('setCount')), 1)
      await this.state.storage.put('setCount', this.setCount)
    }
    if (searchParams.has('callback')) {
      this.callback = searchParams.get('callback')
      await this.state.storage.put('callback', this.callback)
    }
    if (searchParams.has('repeat')) {
      this.repeat = searchParams.get('repeat').toLowerCase()[0] !== 'f'
      await this.state.storage.put('repeat', this.repeat)
    }

    const oldValue = this.value
    this.value = searchParams.has('reset') ? 0 : searchParams.has('read') ? this.value : this.value + 1

    if (this.value != oldValue) {
      if (this.callback && this.value % this.setCount === 0 && (this.repeat || this.value === this.setCount)) {
        const callbacks = Array.isArray(this.callback) ? this.callback : [callback]
        for (let i = 0; i < callbacks.length; i++) {
          const url = typeof callbacks[i] === 'string' || callbacks[i] instanceof String ? callbacks[i] : callbacks[i].url
          const init = callbacks[i].init || {}
          init.headers = { 'content-type': 'application/json', ...(callbacks[i].headers || init.headers) }
          init.method = callbacks[i].method || init.method || 'POST'
          if (['POST', 'PUT', 'PATCH'].includes(init.method)) init.body = JSON.stringify(callbacks[i].body)
          console.log({ url, init })
          const data = await fetch(url, init)
          console.log({ data: await data.text() })
        }
      }
      await this.state.storage.put('value', this.value)
    }

    const retval = {
      key: pathname.replace(/^\/(api\/?)?/, ''),
      value: this.value,
      count: origin + pathname,
      read: origin + pathname + '?read',
      reset: origin + pathname + '?reset',
    }
    return new Response(JSON.stringify(retval, null, 2), { headers: { 'content-type': 'application/json' } })
  }
}
