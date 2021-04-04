export async function retry(fn: () => Promise<any>, retries = 5) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      const rvalue = await fn();
      return rvalue;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
