import { ReactNode } from 'react';

const Message = ({children}: {children: ReactNode}) => {
  return (
    <div className='bg-blue-500 p-2 text-white rounded max-w-xs'>{children}</div>
  )
}

export default Message;