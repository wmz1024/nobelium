import { NotionAPI } from "@/lib/server/index"

const { NOTION_ACCESS_TOKEN } = process.env

const client = new NotionAPI({apiBaseUrl: "https://101121.notion.site/api/v3", authToken: NOTION_ACCESS_TOKEN })

export default client
