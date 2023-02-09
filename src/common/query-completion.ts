const DEFAULT_PARAMS = {
  model: "text-davinci-003",
  temperature: 0.5,
  max_tokens: 400,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export const APPROX_CHARS_PER_TOKEN = 4;

/** Queries the OpenAI text completion API. */
export async function queryCompletion(
  apiKey: string,
  prompt: string
): Promise<CompletionResponse> {
  const max_tokens = Math.max(
    400,
    Math.floor((prompt.length * 2) / APPROX_CHARS_PER_TOKEN)
  );
  const params = { ...DEFAULT_PARAMS, max_tokens };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({ ...params, prompt }),
  };

  const startMs = Date.now();
  const res = await fetch(
    "https://api.openai.com/v1/completions",
    requestOptions
  );
  const body = await res.json();
  const responseMs = Date.now() - startMs;

  console.log("Completion response", body);
  if (res.status === 200) {
    return {
      params: { provider: "openai", ...params },
      startMs,
      responseMs,
      success: true,
      status: body.status,
      body: body as SuccessBody,
    };
  } else {
    return {
      params: { provider: "openai", ...params },
      startMs,
      responseMs,
      success: false,
      status: body.status,
      body: body as ErrorBody,
    };
  }
}

export type CompletionResponse =
  | {
      params: CompletionParams;
      startMs: number;
      responseMs: number;
      success: false;
      status: number;
      body: ErrorBody;
    }
  | {
      params: CompletionParams;
      startMs: number;
      responseMs: number;
      success: true;
      status: number;
      body: SuccessBody;
    };

export type CompletionParams = {
  provider: "openai";
  model: string;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
};

export type ErrorBody = { error: { message: string } };

export type SuccessBody = {
  choices: { text: string }[];
  id: string;
  model: string;
  usage: {};
};
