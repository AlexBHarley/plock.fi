export async function retryTx(fn: any, args: any[], retries = 5) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      const rvalue = await fn(...args);
      return rvalue;
    } catch (e) {
      console.error(e);
      lastError = e;
    }
  }
  throw lastError;
}
