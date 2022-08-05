export default {
  fetch: (req, env) => {
    // get durable object
    // const ip = req.headers.get('cf-connecting-ip')
    const { hostname, pathname } = new URL(req.url)
    const stub = env.COUNTER.get(env.COUNTER.idFromName(hostname + pathname))
    
    // fetch durable object
    return stub.fetch(req)
  }
}

export class Counter {
  constructor(state, env) {
    this.state = state;
    // `blockConcurrencyWhile()` ensures no requests are delivered until
    // initialization completes.
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get("value");
      // After initialization, future reads do not need to access storage.
      this.value = stored || 0;
    });
  }

  // Handle HTTP requests from clients.
  async fetch(req) {
    const url = new URL(req.url)
    // use this.value rather than storage
    this.value = url.searchParams.has('reset') ? 0 : url.searchParams.has('value') ? this.value : this.value + 1
    await this.state.storage.put("value", this.value)
    return new Response(JSON.stringify({
      key: url.pathname.replace('/api/',''),
      value: this.value,
      increment: url.origin + url.pathname,
      read: url.origin + url.pathname + '?value',
      reset: url.origin + url.pathname + '?reset',
    }, null, 2), { headers: { 'content-type': 'application/json' }})
  }
}

