const DEFAULT_PARAMS = {
  model: "code-davinci-002",
  temperature: 0.9,
  max_tokens: 400,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

/** Queries the OpenAI text completion API. */
export async function queryCompletion(apiKey: string, prompt: string) {
  const params = { ...DEFAULT_PARAMS, prompt };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(params),
  };
  const response = await fetch(
    "https://api.openai.com/v1/completions",
    requestOptions
  );
  const data = await response.json();
  return data;
}
