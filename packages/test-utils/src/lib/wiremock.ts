const WIREMOCK_URL = 'http://localhost:8081/__admin';

export async function resetMappings() {
  await fetch(`${WIREMOCK_URL}/mappings/reset`, { method: 'POST' });
}

export async function addMapping(mapping: any) {
  await fetch(`${WIREMOCK_URL}/mappings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mapping),
  });
}
