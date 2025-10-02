export async function createLatency(timeSeconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeSeconds * 1000);
  });
}
