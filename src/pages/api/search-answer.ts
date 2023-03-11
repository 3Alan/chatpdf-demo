import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIStream } from '../../utils/chatgptAnswer';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { prompt, apiKey } = req.body;

    const stream = await OpenAIStream(prompt, apiKey);

    res.status(200).json(stream);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
