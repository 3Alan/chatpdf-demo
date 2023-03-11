import { createClient } from "@supabase/supabase-js";
import { encode } from "gpt-3-encoder";
import { Configuration, OpenAIApi } from "openai";

function generateNewChunkList(chunkList: string[]) {
  const combined = [];
  let currentString = "";

  for (let i = 0; i < chunkList.length; i++) {
    if (encode(currentString).length + encode(chunkList[i]).length > 300) {
      combined.push({
        content_length: currentString.trim().length,
        content: currentString.trim(),
        content_tokens: encode(currentString.trim()).length,
      });
      currentString = "";
    }

    currentString += chunkList[i];
  }

  combined.push({
    content_length: currentString.trim().length,
    content: currentString.trim(),
    content_tokens: encode(currentString.trim()).length,
  });

  return combined;
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const { sentenceList } = req.body as any;
    

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const chunkList = generateNewChunkList(sentenceList);

    for (let i = 0; i < chunkList.length; i++) {
      const chunk = chunkList[i];
      const { content, content_length, content_tokens } = chunk;

      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: content,
      });

      const [{ embedding }] = embeddingResponse.data.data;

      console.log(embedding, '-----------');

      const { data, error } = await supabase
        .from("pg")
        .insert({
          content,
          content_length,
          content_tokens,
          embedding,
        })
        .select("*");

      if (error) {
        console.log("error", error);
      } else {
        console.log("saved", i);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
};

export default handler;
