import { Card, Input, message } from 'antd';
import axios from 'axios';
import { FC, useState } from 'react';
import Message from './Message';

interface ChatWindowProps {
  className?: string;
  apiKey: string;
}

interface MessageItem {
  reply: string;
  references: { id: number; content: string }[];
}

const ChatWindow: FC<ChatWindowProps> = ({ className, apiKey }) => {
  const [loading, setLoading] = useState(false);
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const onSearch = async (value: string) => {
    try {
      if (!apiKey) {
        message.error('please input your apiKey');
        return;
      }

      let answer = {} as any;

      setLoading(true);
      const embedRes = await axios('/api/search-embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { query: value, apiKey, matches: 1 }
      });
      setLoading(false);
      answer.references = embedRes.data;

      const prompt = `
      Use the following passages to provide an answer to the query: "${value}"
      ${embedRes.data?.map((d: any) => d.content).join('\n\n')}
      `;

      const answerResponse = await fetch('/api/search-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, apiKey })
      });
      setLoading(false);

      if (!answerResponse.ok) {
        throw new Error(answerResponse.statusText);
      }

      const data = answerResponse.body;
      if (!data) {
        throw new Error('No data');
      }
      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        answer.reply = answer.reply + chunkValue;
      }

      setMessageList([...messageList, answer]);
    } catch (error) {
      setLoading(false);
      console.log(error);
    }

    // inputRef.current?.focus();
  };

  console.log(messageList);

  return (
    <Card className={className} title="Card title" bordered={false} style={{ width: 300 }}>
      <div className="flex flex-col justify-between h-full">
        <div>
          <Message>21421421</Message>

          {messageList.map((item, key) => (
            <div key={key}>
              <div>{item.reply}</div>
              {item.references?.map(referenceItem => (
                <div key={referenceItem.id}>{referenceItem.content}</div>
              ))}
            </div>
          ))}
        </div>
        <Input.Search
          placeholder="input search text"
          allowClear
          loading={loading}
          onSearch={onSearch}
          style={{ width: 304 }}
        />
      </div>
    </Card>
  );
};

export default ChatWindow;
