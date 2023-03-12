import classNames from 'classnames';
import { FC, PropsWithChildren, useEffect, useState } from 'react';
import Loading from './Loading';

interface MessageProps extends PropsWithChildren {
  isQuestion?: boolean;
  loading?: boolean;
  references?: { id: number; content: string }[];
  text: string;
}

const Message: FC<MessageProps> = ({ text = '', isQuestion, references, loading }) => {
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    setWords(text.split(' '));
  }, [text]);

  if (loading) {
    return <Loading />;
  }

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

      {references && (
        <div className="px-3 pt-2 pb-2 border-t-gray-200 border-t text-right">
          <span className="text-gray-600">{references.length} References</span>
        </div>
      )}
    </div>
  );
};

export default Message;
