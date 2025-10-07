/**
 * Utility function to wait for a service to be ready
 */
export async function waitForService(
  url: string,
  serviceName: string,
): Promise<void> {
  const timeout = 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ ${serviceName} is ready at ${url}`);
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`❌ ${serviceName} failed to start within ${timeout}ms`);
}


