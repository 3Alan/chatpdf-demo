import { Spin } from 'antd';
import classNames from 'classnames';
import { FC, PropsWithChildren } from 'react';

interface MessageProps extends PropsWithChildren {
  isQuestion?: boolean;
  loading?: boolean;
  references?: { id: number; content: string }[];
}

const Message: FC<MessageProps> = ({ children, isQuestion, references, loading }) => {
  return (
    <div
      className={classNames('flex flex-col pt-2 shadow rounded-lg max-w-md mb-5', {
        'self-end': isQuestion,
        'bg-blue-500': isQuestion,
        'text-white': isQuestion
      })}
    >
      <div className="px-3 pb-2">{children}</div>

      {references && (
        <div className="px-3 pt-2 pb-2 border-t-gray-200 border-t text-right">
          <span className="text-gray-600">{references.length} References</span>
        </div>
      )}
    </div>
  );
};

export default Message;
