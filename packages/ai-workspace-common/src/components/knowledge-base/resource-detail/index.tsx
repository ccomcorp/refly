import { Markdown } from '@refly-packages/ai-workspace-common/components/markdown';
import { IconBulb, IconCodepen } from '@arco-design/web-react/icon';

// 自定义样式
import './index.scss';
import { useSearchParams } from '@refly-packages/ai-workspace-common/utils/router';
import { Skeleton, Message as message } from '@arco-design/web-react';
import {
  type KnowledgeBaseTab,
  useKnowledgeBaseStore,
} from '@refly-packages/ai-workspace-common/stores/knowledge-base';
// 请求
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
// 类型
import { Resource } from '@refly/openapi-schema';
import { useEffect, useState } from 'react';
import { safeParseURL } from '@refly/utils/url';
import { useListenToSelection } from '@refly-packages/ai-workspace-common/hooks/use-listen-to-selection';
import { useKnowledgeBaseTabs } from '@refly-packages/ai-workspace-common/hooks/use-knowledge-base-tabs';

export const KnowledgeBaseResourceDetail = () => {
  const [isFetching, setIsFetching] = useState(false);
  const knowledgeBaseStore = useKnowledgeBaseStore();
  const { handleAddTab } = useKnowledgeBaseTabs();

  const [queryParams] = useSearchParams();
  const resId = queryParams.get('resId');
  const kbId = queryParams.get('kbId');

  const resourceDetail = knowledgeBaseStore?.currentResource as Resource;

  const handleGetDetail = async (resourceId: string) => {
    setIsFetching(true);
    try {
      const { data: newRes, error } = await getClient().getResourceDetail({
        query: {
          resourceId,
        },
      });

      if (error) {
        throw error;
      }
      if (!newRes?.success) {
        throw new Error(newRes?.errMsg);
      }

      console.log('newRes', newRes);
      const resource = newRes?.data as Resource;
      knowledgeBaseStore.updateResource(resource);

      setTimeout(() => {
        // 添加新 Tab
        const newTab: KnowledgeBaseTab = {
          title: resource?.title || '',
          key: resource?.resourceId || '',
          content: resource?.contentPreview || '',
          collectionId: kbId || '',
          resourceId: resource?.resourceId || '',
        };
        handleAddTab(newTab);
      });
    } catch (err) {
      message.error('获取内容详情失败，请重新刷新试试');
    }

    setIsFetching(false);
  };

  useListenToSelection(`knowledge-base-resource-detail-container`, 'resource-detail');
  useEffect(() => {
    if (resId) {
      console.log('params resId', resId);
      handleGetDetail(resId as string);
    }
  }, [resId]);

  return (
    <div className="knowledge-base-resource-detail-container">
      <div className="knowledge-base-resource-detail-body">
        {isFetching ? (
          <div style={{ margin: '20px auto' }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          <div className="knowledge-base-resource-meta">
            <div className="knowledge-base-directory-site-intro">
              <div className="site-intro-icon">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${safeParseURL(resourceDetail?.data?.url as string)}&sz=${32}`}
                  alt={resourceDetail?.data?.url}
                />
              </div>
              <div className="site-intro-content">
                <p className="site-intro-site-name">{resourceDetail?.data?.title}</p>
                <a className="site-intro-site-url" href={resourceDetail?.data?.url} target="_blank">
                  {resourceDetail?.data?.url}
                </a>
              </div>
            </div>
            <div className="knowledge-base-directory-action">
              <div className="action-summary">
                <IconBulb />
                <span className="action-summary-text">AI Summary</span>
              </div>

              <div className="action-summary">
                <IconCodepen />
                <span className="action-summary-text">知识图谱</span>
              </div>
            </div>
            {/* <div className="knowledge-base-directory-keyword-list">
              {(resourceDetail?.data?.keywords || []).map((keyword, index) => (
                <div className="knowledge-base-directory-keyword-item" key={index}>
                  <span>{keyword}</span>
                </div>
              ))}
            </div> */}
          </div>
        )}
        {isFetching ? (
          <div style={{ margin: '20px auto' }}>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
            <Skeleton animation style={{ marginTop: 24 }}></Skeleton>
          </div>
        ) : (
          <div className="knowledge-base-resource-content">
            <div className="knowledge-base-resource-content-title">{resourceDetail?.title}</div>
            <Markdown content={resourceDetail?.content || ''}></Markdown>
          </div>
        )}
      </div>
    </div>
  );
};
