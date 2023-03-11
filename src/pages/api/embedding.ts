import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { sentenceList } = req.body as any;

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    for (let i = 0; i < sentenceList.length; i++) {
      const chunk = sentenceList[i];
      const { content, content_length, content_tokens } = chunk;

      const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: content
      });

      const [{ embedding }] = embeddingResponse.data.data;

      console.log(embedding, '-----------');

      const { data, error } = await supabase
        .from('pg')
        .insert({
          content,
          content_length,
          content_tokens,
          embedding
        })
        .select('*');

      if (error) {
        console.log('error', error);
      } else {
        console.log('saved', i);
      }

      // 防止触发openai的每分钟限制
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    res.status(200).json({ data: 'ok' });
  } catch (error) {
    console.error(JSON.stringify(error));
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
