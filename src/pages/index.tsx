import { type NextPage } from 'next';
import Head from 'next/head';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card } from 'antd';
import ChatWindow from '../components/chatWindow';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Chat With Image</title>
        <meta name="description" content="Chat With PDF" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-slate-100 py-4 h-screen">
        <div className="flex flex-row justify-center m-auto w-5/6 space-x-4 h-full overflow-hidden">
          <ChatWindow className="flex flex-col h-full overflow-hidden" />

          <Card
            style={{ width: 700 }}
            className="h-full overflow-auto scroll-smooth"
            bodyStyle={{ padding: 0 }}
          >
          </Card>
        </div>
      </main>
    </>
  );
};

export default Home;
