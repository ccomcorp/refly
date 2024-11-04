import { Helmet } from "react-helmet"
import "./index.scss"

// components
import { ConvList } from "@refly-packages/ai-workspace-common/components/conv-list"
import { useTranslation } from "react-i18next"
import { useJumpNewPath } from "@refly-packages/ai-workspace-common/hooks/use-jump-new-path"
import { Typography } from "@arco-design/web-react"
import { MessageIntentSource } from "@refly-packages/ai-workspace-common/types/copilot"

const ConvLibrary = () => {
  const { t } = useTranslation()
  const { jumpToConv } = useJumpNewPath()

  return (
    <div>
      <Helmet>
        <title>
          {t("productName")} | {t("tabMeta.threadLibrary.title")}
        </title>
      </Helmet>
      <div className="conv-library-header-container">
        <div className="conv-library-header">
          <Typography.Title heading={4}>
            {t("tabMeta.threadLibrary.title")}
          </Typography.Title>
          <span></span>
        </div>
      </div>
      <ConvList
        classNames=""
        handleConvItemClick={(convId, projectId) => {
          jumpToConv({
            convId,
            projectId,
            state: {
              navigationContext: {
                shouldFetchDetail: true,
                source: MessageIntentSource.ConversationList,
              },
            },
          })
        }}
      />
    </div>
  )
}

export default ConvLibrary
