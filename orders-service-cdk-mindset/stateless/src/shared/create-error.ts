export async function createError(): Promise<void> {
  const chance = Math.random();
  if (chance < 0.8) {
    throw new Error('Random failure occurred');
  }
}
