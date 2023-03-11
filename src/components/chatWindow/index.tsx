import { Card, Input } from 'antd';
import Message from './Message';

const ChatWindow = ({ className }) => {
  return (
    <Card className={className} title="Card title" bordered={false} style={{ width: 300 }}>
      <div className="flex flex-col justify-between h-full">
        <div>
          <Message>21421421</Message>
        </div>
        <Input.Search
          placeholder="input search text"
          allowClear
          // onSearch={onSearch}
          style={{ width: 304 }}
        />
      </div>
    </Card>
  );
};

export default ChatWindow;
