--  RUN 1st
create extension vector;

-- RUN 2nd
create table chatgpt (
  id bigserial primary key,
  content text,
  content_length bigint,
  content_tokens bigint,
  page_num bigint,
  embedding vector (1536)
);

-- RUN 3rd after running the scripts
create or replace function chatgpt_search (
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  content_length bigint,
  content_tokens bigint,
  page_num bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    chatgpt.id,
    chatgpt.content,
    chatgpt.content_length,
    chatgpt.content_tokens,
    chatgpt.page_num,
    1 - (chatgpt.embedding <=> query_embedding) as similarity
  from chatgpt
  where 1 - (chatgpt.embedding <=> query_embedding) > similarity_threshold
  order by chatgpt.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RUN 4th
create index on chatgpt 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);