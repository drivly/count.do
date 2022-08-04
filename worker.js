export default {
  fetch: (req, env) => {
    // get durable object
    const stub = env.COUNTER.get(env.COUNTER.idFromName(req.headers.get('cf-connecting-ip'))
    
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
  async fetch(request) {
    // use this.value rather than storage
    this.value = this.value++
    this.state.storage.put("value", this.value)
    return new Response(this.value)
  }
}

