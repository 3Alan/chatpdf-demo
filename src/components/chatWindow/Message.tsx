import { Popover } from 'antd';
import classNames from 'classnames';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import eventEmitter from '../../utils/eventEmitter';
import Loading from './Loading';

interface MessageProps extends PropsWithChildren {
  isQuestion?: boolean;
  loading?: boolean;
  references?: { id: number; content: string; page_num: number }[];
  text: string;
}

const Message: FC<MessageProps> = ({ text = '', isQuestion, references = [], loading }) => {
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    setWords(text.split(' '));
  }, [text]);

  if (loading) {
    return <Loading />;
  }

  const onPageNumClick = (num: number) => {
    eventEmitter.emit('scrollToPage', num);
  };

  return (
    <div
      className={classNames(
        'flex flex-col pt-2 shadow rounded-lg max-w-md mb-5',
        isQuestion ? 'bg-blue-500 self-end text-white' : 'bg-blue-50'
      )}
    >
      {isQuestion ? (
        <div className="px-3 pb-2">{text}</div>
      ) : (
        <div className="px-3 pb-2 text-gray-800">
          {words.map((word, index) => (
            <span
              key={index}
              className="text-gray-800 animate-fade-in"
              style={{ animationDelay: `${index * 0.01}s` }}
            >
              {word}{' '}
            </span>
          ))}
        </div>
      )}

      {references.length > 0 && (
        <div className="px-3 pt-2 pb-2 border-t-gray-200 border-t text-right">
          <Popover
            placement="rightBottom"
            content={
              <div className="w-96 h-96 overflow-auto">
                {references.map((item, index) => (
                  <div key={index} className="pb-3">
                    <a onClick={() => onPageNumClick(item.page_num)}>#Page {item.page_num}</a>
                    <div className="text-xs pl-1">{item.content}</div>
                  </div>
                ))}
              </div>
            }
          >
            <span className="cursor-pointer text-gray-600">{references.length} References</span>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default Message;
