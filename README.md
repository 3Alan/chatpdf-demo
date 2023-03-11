- 左边对话框右边 pdf
- 回答问题引用右侧的 pdf 高亮
- pdf 框选提问题
- pdf 可进行标注
- 标注后的 pdf 可以导出

## Reference

- https://github.com/mckaywrigley/paul-graham-gpt
- https://github.com/SkywalkerDarren/chatWeb

## 思路

1. 提取 pdf 文本
2. 基于 openai token 将文本分段
3. 调用 gpt embedding api 生成向量并保存起来（数据库）
4. 开始提问题
5. 将问题通过 openai 向量接口查询并返回对应 embedding
6. 将返回的 embedding 和保存起来的 embedding 进行比对匹配最合适的分段，这个时候可以做高亮
7. 将匹配好的分段组成 prompt 然后就可以问 chatgpt 问题了
8. 能不能不依赖数据库进行 vector 对比
