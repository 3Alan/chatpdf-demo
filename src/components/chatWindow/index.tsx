import { SettingOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal } from 'antd';
import axios from 'axios';
import { FC, Fragment, useEffect, useRef, useState } from 'react';
import Message from './Message';

interface ChatWindowProps {
  className?: string;
}

interface MessageItem {
  question?: string;
  reply?: string;
  references?: { id: number; content: string }[];
}

const ChatWindow: FC<ChatWindowProps> = ({ className }) => {
  const chatWindowEndAnchorRef = useRef<HTMLDivElement>(null);
  const settings = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [query, setQuery] = useState('');
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  useEffect(() => {
    const localSettings = JSON.parse(localStorage.getItem('settings') as string);
    if (!localSettings) {
      setShowSettingModal(true);
    } else {
      settings.current = localSettings;
    }
  }, [showSettingModal]);

  const onSearch = async (value: string) => {
    setQuery('');
    try {
      if (!settings.current?.apiKey) {
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
        data: { query: value, apiKey: settings.current?.apiKey, matches: 3 }
      });
      answer.references = embedRes.data;

      const prompt = `
      Use the following text to provide an answer to the query: "${value}"
      ${embedRes.data?.map((d: any) => d.content).join('\n\n')}
      `;

      const answerResponse = await fetch('/api/search-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, apiKey: settings.current?.apiKey })
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

      const newMessageList = [...messageList];
      messageList.push(answer);
      setMessageList(newMessageList);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        answer.reply = answer.reply + chunkValue;
        console.log(newMessageList, 'newMessageList', chunkValue);

        newMessageList[messageList.length - 1] = answer;
        setMessageList(newMessageList);
      }

      chatWindowEndAnchorRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const onSaveSettings = () => {
    form
      .validateFields()
      .then(values => {
        localStorage.setItem('settings', JSON.stringify(values));
        setShowSettingModal(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <>
      <Card
        className={className}
        bodyStyle={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
        title="Chat with PDF"
        bordered={false}
        extra={
          <Button onClick={() => setShowSettingModal(true)} icon={<SettingOutlined />}></Button>
        }
      >
        <div ref={chatWindowEndAnchorRef} className="flex flex-col flex-1 overflow-auto">
          {messageList.map((item, index) => (
            <Fragment key={index}>
              {item.question ? (
                <Message isQuestion>{item.question}</Message>
              ) : (
                <Message references={item.references}>{item.reply}</Message>
              )}
            </Fragment>
          ))}
        </div>

        <div className="py-4">
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

        <Modal
          title="Settings"
          open={showSettingModal}
          onOk={onSaveSettings}
          onCancel={() => setShowSettingModal(false)}
        >
          <Form form={form}>
            <Form.Item
              label="apiKey"
              name="apiKey"
              rules={[{ required: true, message: 'Please input your apiKey!' }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </>
  );
};

export default ChatWindow;
