export default {
  fetch: (req, env) => {
    // get durable object
    const { hostname, pathname } = new URL(req.url)
    const name = hostname + pathname.replace(/^\/(api\/?)?/, '')
    const id = env.COUNTER.idFromName(name)
    const stub = env.COUNTER.get(id)

    // call fetch from durable object
    return stub.fetch(req)
  },
}

export class Counter {
  constructor(state, env) {
    this.state = state
    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get('value')
      // After initialization, future reads do not need to access storage.
      this.value = stored || 0
    })
  }

  // Handle HTTP requests from clients.
  async fetch(req) {
    const { origin, pathname, searchParams } = new URL(req.url)
    // use this.value rather than storage
    this.value = searchParams.has('reset') ? 0 : searchParams.has('read') ? this.value : this.value + 1
    await this.state.storage.put('value', this.value)
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

