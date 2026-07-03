import fs from "fs";

const pathFile =
  process.env.EMMA_PATHS_JSON ||
  "C:\\Users\\ashra\\Emma\\knowledgebase\\config\\emma.paths.json";

export type EmmaPaths = {
  knowledgebaseRoot: string;
  dictionary: string;
  prompts: string;
  commands: string;
  voice: { stt: string; tts: string; wakeword: string };
  skills: string;
  evaluation: string;
  integrations: { gemini: string; grok: string };
  embeddings: string;
};

export const EMMA_PATHS = JSON.parse(
  fs.readFileSync(pathFile, "utf-8")
) as EmmaPaths;
