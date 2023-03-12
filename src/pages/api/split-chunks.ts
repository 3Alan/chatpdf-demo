import { encode } from 'gpt-3-encoder';
import { NextApiRequest, NextApiResponse } from 'next';

function generateNewChunkList(chunkList: { sentence: string; pageNum: number }[]) {
  const combined = [];
  let currentString = '';
  let currentPageNum = 1;

  for (let i = 0; i < chunkList.length; i++) {
    if (
      currentPageNum !== chunkList[i].pageNum ||
      encode(currentString).length + encode(chunkList[i].sentence).length > 300
    ) {
      combined.push({
        content_length: currentString.trim().length,
        content: currentString.trim(),
        content_tokens: encode(currentString.trim()).length,
        page_num: currentPageNum
      });
      currentString = '';
    }

    currentString += chunkList[i].sentence;
    currentPageNum = chunkList[i].pageNum;
  }

  combined.push({
    content_length: currentString.trim().length,
    content: currentString.trim(),
    content_tokens: encode(currentString.trim()).length,
    page_num: currentPageNum
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
