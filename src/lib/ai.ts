export interface ClusterItem {
  name: string
  emoji: string
  description: string
  items: string[] // IDs of items
}

export interface AiResponse {
  clusters: ClusterItem[]
  insights?: {
    totalAnalyzed: number
    topTrend: string
    suggestion: string
  }
}

// 扩展的评价信息，用于更智能的分析
export interface EnhancedReviewItem {
  id: string
  content: string
  tags?: string[] | null
  location?: string | null
}

export async function clusterContent(
  contentItems: EnhancedReviewItem[],
  apiKey: string,
  baseUrl: string = "https://api.siliconflow.cn/v1"
): Promise<AiResponse> {
  // 构建更丰富的分析数据
  const reviewsForAnalysis = contentItems.map(c => ({
    id: c.id,
    content: c.content,
    tags: c.tags?.join(', ') || '无',
    location: c.location || '未标记'
  }))

  const prompt = `
你是一个美食评价分析助手。请仔细分析以下美食评价，并将它们智能分类成 3-5 个有意义的主题。

分析维度：
1. 菜系类型（如：中餐、西餐、日料、甜点等）
2. 用餐场景（如：约会、聚餐、独食、商务等）
3. 情感倾向（如：推荐、避雷、普通等）
4. 食物特征（如：辣、甜、健康、重口味等）

请返回 JSON 格式，结构如下：
{
  "clusters": [
    {
      "name": "聚类名称（简短有特色，不超过6个字）",
      "emoji": "一个最能代表这个聚类的emoji",
      "description": "一句话描述这个聚类的特点",
      "items": ["id1", "id2", ...]
    }
  ],
  "insights": {
    "totalAnalyzed": 分析的评价总数,
    "topTrend": "当前最热门的美食趋势（一句话）",
    "suggestion": "给用户的美食建议（一句话）"
  }
}

评价数据：
${JSON.stringify(reviewsForAnalysis, null, 2)}

注意：
- 每个评价只能属于一个聚类
- 聚类名称要简洁有趣
- emoji要贴合聚类主题
- description控制在20字以内
`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7, // 增加一点创造性
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("AI API error response:", errorText)
      throw new Error(`AI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    return JSON.parse(content)
  } catch (error) {
    console.error("Clustering failed:", error)
    throw error
  }
}
