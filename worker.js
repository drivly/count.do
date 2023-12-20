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
      this.callback = (await this.state.storage.get('callback')) || []
    })
  }

  async fetch(req) {
    const { origin, pathname, searchParams } = new URL(req.url)
    if (req.method === 'POST') {
      const callback = await req.json()
      if (callback !== undefined) this.callback = callback
      if (!Array.isArray(this.callback) && this.callback !== null) this.callback = [this.callback]
      for (let i = 0; i < this.callback.length; i++) {
        const callback = this.callback[i]
        if (typeof callback === 'string') this.callback[i] = { url: callback }
        if (!this.callback[i]) this.callback[i] = {}
        if (!this.callback[i].setCount) this.callback[i].setCount = 1
        if (this.callback[i].repeat === undefined) this.callback[i].repeat = true
      }
      await this.state.storage.put('callback', this.callback)
    }
    if (searchParams.has('callback') || searchParams.has('setCount') || searchParams.has('repeat')) {
      const cb = this.callback.length === 1 ? this.callback[0] : {}
      if (searchParams.has('callback')) {
        cb.url = decodeURIComponent(searchParams.get('callback'))
        if (!cb.setCount) cb.setCount = 1
        if (cb.repeat === undefined) cb.repeat = true
      }
      if (searchParams.has('setCount')) cb.setCount = Math.max(parseInt(searchParams.get('setCount')), 1)
      if (searchParams.has('repeat')) cb.repeat = searchParams.get('repeat')[0].toLowerCase() !== 'f'
      if (this.callback.length === 1) this.callback[0] = cb
      else this.callback.push(cb)
      await this.state.storage.put('callback', this.callback)
    }

    const oldValue = this.value
    this.value = searchParams.has('reset') ? 0 : searchParams.has('read') ? this.value : this.value + 1

    if (this.value > oldValue) {
      const callbacks = this.callback ? (Array.isArray(this.callback) ? this.callback : [callback]) : []
      for (let i = 0; i < callbacks.length; i++) {
        const callback = callbacks[i]
        if (this.value % callback.setCount === 0 && (callback.repeat || this.value === callback.setCount)) {
          const url = callback.url
          const init = callback.init || {}
          init.headers = { 'content-type': init.body ? 'application/json' : undefined, ...(callback.headers || init.headers) }
          if (['POST', 'PUT', 'PATCH'].includes(init.method)) init.body = JSON.stringify(callback.body)
          init.method = callback.method || init.method || init.body ? 'POST' : 'GET'
          console.log({ url, init })
          const data = await fetch(url, init)
          console.log({ data: data.headers.get('content-type') ? await data.json() : await data.text() })
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
      callbacks: this.callback?.length ? this.callback : undefined,
    }
    return new Response(JSON.stringify(retval, null, 2), { headers: { 'content-type': 'application/json' } })
  }
}
