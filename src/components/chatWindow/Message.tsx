import { FC, PropsWithChildren } from 'react';

interface MessageProps extends PropsWithChildren {
  reply?: boolean;
  loading?: boolean;
}

const Message: FC<MessageProps> = ({ children }) => {
  return <div className="bg-blue-500 p-2 text-white rounded max-w-xs">{children}</div>;
};

export default Message;
