export interface AiResponse {
  clusters: {
    name: string
    items: string[] // IDs or indices of items
  }[]
}

export async function clusterContent(
  contentItems: { id: string; content: string }[],
  apiKey: string,
  baseUrl: string = "https://api.siliconflow.cn/v1"
): Promise<AiResponse> {
  const prompt = `
You are an AI assistant that groups food reviews into thematic clusters.
Group the following items into 3-5 distinct, descriptive clusters based on cuisine, mood, or food type.
Return ONLY a JSON object with this structure:
{
  "clusters": [
    { "name": "Cluster Name", "items": ["id1", "id2"] }
  ]
}

Items:
${JSON.stringify(contentItems.map(c => ({ id: c.id, content: c.content })))}
`

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct", // diligent default, user can change
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    return JSON.parse(content)
  } catch (error) {
    console.error("Clustering failed:", error)
    throw error
  }
}
