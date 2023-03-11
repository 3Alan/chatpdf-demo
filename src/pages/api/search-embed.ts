import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseClient } from '../../utils/supabaseClient';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { query, apiKey, matches } = req.body;

    const input = query.replace(/\n/g, ' ');

    const embedRes = await axios(`https://api.openai.com/v1/embeddings`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      method: 'POST',
      data: {
        model: 'text-embedding-ada-002',
        input
      }
    });

    const { embedding } = embedRes.data.data[0];

    const { data: chunks, error } = await supabaseClient.rpc('pg_search', {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches
    });

    if (error) {
      console.error(error);
      return new Response('Error', { status: 500 });
    }

    res.status(200).json(chunks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
