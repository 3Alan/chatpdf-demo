import { type NextPage } from 'next';
import Head from 'next/head';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button, Card, UploadProps } from 'antd';
import { message, Upload } from 'antd';
import { type TextItem } from 'pdfjs-dist/types/src/display/api';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ChatWindow from '../components/chatWindow';
import { InboxOutlined } from '@ant-design/icons';
import eventEmitter from '../utils/eventEmitter';

const { Dragger } = Upload;

function finDomByText(text: string, parent: any) {
  const elements = parent.querySelectorAll('span'); // 获取文档中的所有span元素
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.innerText.includes(text)) {
      return element;
    }
  }
}

function addHighlightText(element: any) {
  // 获取该元素的文本内容
  const text = element.textContent;

  // 用 <pre> 标签包装文本
  const markElem = document.createElement('mark');
  markElem.textContent = text;

  // 克隆原始 div 元素，并将其属性复制到副本中
  const newElement = element.cloneNode(true);
  newElement.innerHTML = '';
  newElement.appendChild(markElem);

  // 替换原始的 <div> 元素
  element.parentNode.replaceChild(newElement, element);
  newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

const Home: NextPage = () => {
  const [file, setFile] = useState<File | string>('/github-privacy.pdf');
  const disabledUpload = true;
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<unknown>();
  const sentenceRef = useRef<string[]>();

  function scrollToPage(num: number) {
    // @ts-ignore
    pdfRef?.current.pages[num - 1].scrollIntoView();
  }

  useEffect(() => {
    // @ts-ignore
    eventEmitter.on('scrollToPage', scrollToPage);

    return () => {
      // @ts-ignore
      eventEmitter.off('scrollToPage', scrollToPage);
    };
  }, []);

  async function generateEmbedding(sentenceList: any[]) {
    setLoading(true);
    const res = await axios('/api/split-chunks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { sentenceList }
    });

    const { chunkList } = res.data;
    const chunkSize = 2; // 每组的元素个数

    // 由于vercel单个接口10秒限制，所以分批次处理
    for (let i = 0; i < chunkList.length; i += chunkSize) {
      const chunk = chunkList.slice(i, i + chunkSize); // 取出当前组的元素

      await axios('/api/embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          sentenceList: chunk,
          apiKey: JSON.parse(localStorage.getItem('settings') as string).apiKey
        }
      });
    }
    setLoading(false);
  }

  async function onDocumentLoadSuccess(doc: any) {
    const { numPages } = doc;
    const sentenceEndSymbol = /[。.]\s+/;
    const allSentenceList = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const currentPage = await doc.getPage(pageNum);
      const currentPageContent = await currentPage.getTextContent();
      const currentPageText = currentPageContent.items
        .map((item: any) => (item as TextItem).str)
        .join(' ');

      const sentenceList = currentPageText.split(sentenceEndSymbol);
      allSentenceList.push(...sentenceList.map((item: string) => ({ sentence: item, pageNum })));
    }

    sentenceRef.current = allSentenceList.filter(item => item.sentence);
    setNumPages(numPages);
  }

  const props: UploadProps = {
    name: 'file',
    beforeUpload: file => {
      setFile(file);
      return false;
    },
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        void message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        void message.error(`${info.file.name} file upload failed.`);
      }
    }
  };

  const onReading = () => {
    // const textLayer = pdfRef.current[0].nextSibling;
    // const elements = finDomByText('estibulum eu urna nisl. Aenean at hendrerit', textLayer);
    // addHighlightText(elements);

    generateEmbedding(sentenceRef.current as string[]);
  };

  return (
    <>
      <Head>
        <title>Chat With PDF</title>
        <meta name="description" content="Chat With PDF" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-slate-100 py-4 h-screen">
        <div className="flex flex-row justify-center m-auto w-5/6 space-x-4">
          {!disabledUpload && (
            <Button disabled={!file} loading={loading} type="primary" onClick={onReading}>
              start reading
            </Button>
          )}
          {!disabledUpload && !file && (
            <Dragger {...props}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload. Strictly prohibit from uploading company data
                or other band files
              </p>
            </Dragger>
          )}
        </div>
        <div className="flex flex-row justify-center m-auto w-5/6 space-x-4 h-full overflow-hidden">
          <ChatWindow className="flex flex-col h-full overflow-hidden" />

          <Card
            style={{ width: 700 }}
            className="h-full overflow-auto scroll-smooth"
            bodyStyle={{ padding: 0 }}
          >
            {/* @ts-ignore */}
            <Document ref={pdfRef} file={file} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages), (_el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={700}
                  renderAnnotationLayer={false}
                />
              ))}
            </Document>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Home;
