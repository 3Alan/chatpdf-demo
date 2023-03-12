## 运行

```
yarn install
```

由于使用了 supabase 提供的 Postgres 数据库， 故需创建本地环境变量 `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
```

并在 supabase 中初始化 schema.sql 文件内容

```
yarn dev
```

## 大致思路

1. 提取 pdf 文本
2. 基于 openai token 数目限制将文本分段
3. 调用 gpt embedding api 生成向量并保存起来（数据库）
4. 开始提问题
5. 将问题通过 openai 向量接口查询并返回对应 embedding
6. 将返回的 embedding 和保存起来的 embedding 通过数据库进行比对匹配最合适的分段，这个时候可以做相应段落的高亮
7. 将匹配好的分段组成 prompt 然后就可以问 chatgpt 问题了

## TODO

- [ ] 回答问题引用右侧的 pdf 高亮
- [ ] pdf 框选提问题
- [ ] pdf 可进行标注
- [ ] 目前由于 openai api 调用频率受限，大文件 pdf 无法很好的处理

## Reference

- https://github.com/mckaywrigley/paul-graham-gpt
- https://github.com/openai/openai-cookbook/blob/main/examples/How_to_stream_completions.ipynb
- https://github.com/ddiu8081/chatgpt-demo
- https://github.com/SkywalkerDarren/chatWeb
