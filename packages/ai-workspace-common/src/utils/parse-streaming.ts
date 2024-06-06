import { fetchStream } from '@refly-packages/ai-workspace-common/utils/fetch-stream';
import { getAuthTokenFromCookie } from './request';
import { getServerOrigin } from './url';
import { Source, ChatTask } from '@refly/openapi-schema';
import { safeParseJSON } from './parse';

const LLM_SPLIT = '__LLM_RESPONSE__';
const RELATED_SPLIT = '__RELATED_QUESTIONS__';

export const parseStreaming = async (
  controller: AbortController,
  payload: ChatTask,
  onSources: (value: Source[]) => void,
  onMarkdown: (value: string) => void,
  onRelates: (value: string[]) => void,
  onError?: (status: number) => void,
) => {
  const decoder = new TextDecoder();
  let uint8Array = new Uint8Array();
  let chunks = '';
  let sourcesEmitted = false;

  const response = await fetch(`${getServerOrigin()}/v1/conversation/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAuthTokenFromCookie()}`,
    },
    signal: controller.signal,
    body: JSON.stringify({
      task: payload,
    }),
  });
  if (response.status !== 200) {
    onError?.(response.status);
    return;
  }
  const markdownParse = (text: string) => {
    onMarkdown(
      text
        .replace(/\[\[([cC])itation/g, '[citation')
        .replace(/[cC]itation:(\d+)]]/g, 'citation:$1]')
        .replace(/\[\[([cC]itation:\d+)]](?!])/g, `[$1]`)
        .replace(/\[[cC]itation:(\d+)]/g, '[citation]($1)'),
    );
  };
  fetchStream(
    response,
    (chunk) => {
      uint8Array = new Uint8Array([...uint8Array, ...chunk]);
      chunks = decoder.decode(uint8Array, { stream: true });
      if (chunks.includes(LLM_SPLIT)) {
        const [sources, rest] = chunks.split(LLM_SPLIT);
        if (!sourcesEmitted) {
          try {
            onSources(safeParseJSON(sources));
          } catch (e) {
            onSources([]);
          }
        }
        sourcesEmitted = true;
        if (rest.includes(RELATED_SPLIT)) {
          const [md] = rest.split(RELATED_SPLIT);
          markdownParse(md);
        } else {
          markdownParse(rest);
        }
      }
    },
    () => {
      const [, relates] = chunks.split(RELATED_SPLIT);
      try {
        onRelates(safeParseJSON(relates));
      } catch (e) {
        onRelates([]);
      }
    },
  );
};
