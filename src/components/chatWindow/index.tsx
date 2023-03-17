import { SettingOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, message, Modal } from 'antd';
import Image from 'next/image';
import {
  ClipboardEvent,
  FC,
  Fragment,
  useEffect,
  useRef,
  useState
} from 'react';
import Message from './Message';

interface ChatWindowProps {
  className?: string;
}

interface MessageItem {
  question?: string;
  reply?: string;
  references?: { id: number; content: string; page_num: number }[];
}

const ChatWindow: FC<ChatWindowProps> = ({ className }) => {
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const settings = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [query, setQuery] = useState('');
  const [queryImage, setQueryImage] = useState<ArrayBuffer>();
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  useEffect(() => {
    const localSettings = JSON.parse(localStorage.getItem('settings') as string);
    if (!localSettings) {
      setShowSettingModal(true);
    } else {
      settings.current = localSettings;
    }
  }, [showSettingModal]);

  const scrollToBottom = () => {
    setTimeout(() => {
      const chatWindow = chatWindowRef.current;

      if (chatWindow) {
        chatWindow.scrollTop = chatWindow.scrollHeight + 300;
      }
    }, 0);
  };

  const onReply = async (value: string) => {
    try {
      setLoading(true);

      const prompt = value;

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
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        console.log(chunkValue);

        setMessageList(pre => {
          return [
            ...pre.slice(0, -1),
            {
              ...pre.slice(-1),
              reply: pre.slice(-1)[0].reply + chunkValue,
            }
          ];
        });
        requestAnimationFrame(() => scrollToBottom());
      }

      scrollToBottom();
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const onSearch = async (value: string) => {
    setQuery('');
    if (!settings.current?.apiKey) {
      message.error('please input your apiKey');
      return;
    }

    setMessageList([...messageList, { question: value.trim() }, { reply: '' }]);
    scrollToBottom();
    onReply(value);
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData.items;
    for (let index in items) {
      const item = items[index];
      console.log(item.kind);

      if (item.kind === 'file') {
        const blob = item.getAsFile() as File;
        if (blob.type.indexOf('image') === 0) {
          const reader = new FileReader();
          reader.onload = event => {
            setQueryImage(event?.target?.result as ArrayBuffer);
          };
          reader.readAsDataURL(blob);
        }
      }
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
        style={{ width: 500 }}
        className={className}
        bodyStyle={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0'
        }}
        title="Chat with Image"
        bordered={false}
        extra={
          <Button onClick={() => setShowSettingModal(true)} icon={<SettingOutlined />}></Button>
        }
      >
        <div
          ref={chatWindowRef}
          className="scroll-smooth flex flex-col items-start flex-1 overflow-auto px-6"
        >
          {messageList.map((item, index) => (
            <Fragment key={index}>
              {item.question ? (
                <Message isQuestion text={item.question} />
              ) : (
                <Message
                  loading={loading && index === messageList.length - 1}
                  references={item.references}
                  text={item.reply || ''}
                />
              )}
            </Fragment>
          ))}
        </div>

        <div className="p-4 pb-0 border-t border-t-gray-200 border-solid border-x-0 border-b-0">
          {queryImage && (
            <div className="relative h-16 w-auto max-w-full mb-4 overflow-hidden">
              <Image className="object-cover" src={queryImage as any} alt="image" fill />
            </div>
          )}

          <Input.Search
            enterButton="Ask Question"
            size="large"
            value={query}
            placeholder="input your question"
            allowClear
            loading={loading}
            onChange={e => setQuery(e.target.value)}
            onSearch={onSearch}
            onPaste={onPaste}
          />
        </div>

        <Modal
          title="Settings"
          open={showSettingModal}
          onOk={onSaveSettings}
          onCancel={() => setShowSettingModal(false)}
        >
          <Form
            form={form}
            initialValues={{
              apiKey: settings.current?.apiKey
            }}
          >
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
