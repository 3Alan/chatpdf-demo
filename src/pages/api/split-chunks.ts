import { encode } from 'gpt-3-encoder';
import { NextApiRequest, NextApiResponse } from 'next';

function generateNewChunkList(chunkList: string[]) {
  const combined = [];
  let currentString = '';

  for (let i = 0; i < chunkList.length; i++) {
    if (encode(currentString).length + encode(chunkList[i]).length > 300) {
      combined.push({
        content_length: currentString.trim().length,
        content: currentString.trim(),
        content_tokens: encode(currentString.trim()).length
      });
      currentString = '';
    }

    currentString += chunkList[i];
  }

  combined.push({
    content_length: currentString.trim().length,
    content: currentString.trim(),
    content_tokens: encode(currentString.trim()).length
  });

  return combined;
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { sentenceList } = req.body;
    const chunkList = generateNewChunkList(sentenceList);

    res.status(200).json({ chunkList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error' });
  }
};

export default handler;
