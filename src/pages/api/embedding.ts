import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';
import { supabaseClient } from '@/utils/supabaseClient';
import getOpenAIBaseUrl from '../../utils/getOpenAIBaseUrl';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { sentenceList, apiKey } = req.body as any;

    const configuration = new Configuration({
      apiKey,
      basePath: `${getOpenAIBaseUrl()}/v1`  || undefined
    });
    const openai = new OpenAIApi(configuration);

    for (let i = 0; i < sentenceList.length; i++) {
      const chunk = sentenceList[i];
      const { content, content_length, content_tokens, page_num } = chunk;

      const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: content
      });

      const [{ embedding }] = embeddingResponse.data.data;

      const { error } = await supabaseClient
        .from('chatgpt')
        .insert({
          content,
          content_length,
          content_tokens,
          page_num,
          embedding
        })
        .select('*');

      if (error) {
        console.log('error', error);
      } else {
        console.log('saved', i);
      }

      // 防止触发openai的每分钟限制
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    res.status(200).json('ok');
  } catch (error) {
    console.error(JSON.stringify(error));
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
