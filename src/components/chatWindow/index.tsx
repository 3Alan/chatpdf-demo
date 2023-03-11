import { SettingOutlined } from '@ant-design/icons';
import { Button, Card, Input, message, Modal } from 'antd';
import axios from 'axios';
import { FC, useRef, useState } from 'react';
import Message from './Message';

interface ChatWindowProps {
  className?: string;
  apiKey: string;
}

interface MessageItem {
  question?: string;
  reply?: string;
  references?: { id: number; content: string }[];
}

const ChatWindow: FC<ChatWindowProps> = ({ className, apiKey }) => {
  const chatWindowEndAnchorRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const onSearch = async (value: string) => {
    setQuery('');
    try {
      if (!apiKey) {
        message.error('please input your apiKey');
        return;
      }

      setMessageList(pre => [...pre, { question: value }]);
      chatWindowEndAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
      let answer = {
        reply: '',
        references: []
      };

      setLoading(true);
      const embedRes = await axios('/api/search-embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: { query: value, apiKey, matches: 3 }
      });
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

      setMessageList(pre => [...pre, answer]);
      chatWindowEndAnchorRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  return (
    <>
      <Card
        className={className}
        bodyStyle={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
        title="Chat with PDF"
        bordered={false}
        extra={<Button icon={<SettingOutlined />}></Button>}
      >
        <div ref={chatWindowEndAnchorRef} className="flex flex-col flex-1 overflow-auto">
          {messageList.map((item, index) => (
            <>
              {item.question ? (
                <Message isQuestion>{item.question}</Message>
              ) : (
                <Message key={index} references={item.references}>
                  {item.reply}
                </Message>
              )}
            </>
          ))}
        </div>

        <div className="py-6">
          <Input.Search
            enterButton="Ask Question"
            size="large"
            value={query}
            placeholder="input search text"
            allowClear
            loading={loading}
            onChange={e => setQuery(e.target.value)}
            onSearch={onSearch}
          />
        </div>

        {/* <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          <p>Some contents...</p>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal> */}
      </Card>
    </>
  );
};

export default ChatWindow;
