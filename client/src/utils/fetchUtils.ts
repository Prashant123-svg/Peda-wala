// Safe response parser: handles empty or non-JSON responses
export async function parseResponse(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return { raw: text };
  }
}

export async function parseErrorResponse(res: Response) {
  const parsed = await parseResponse(res);
  return parsed || { message: `HTTP ${res.status}` };
}

export default parseResponse;
