type modelType = "openai/gpt-4-turbo" | "anthropic/claude-3.5-sonnet" | "deepseek/deepseek-chat" | "google/gemini-2.5-pro"

export const getBody = (model: modelType, query: string, targetLanguage: string) => {

 if(!model) model = "openai/gpt-4-turbo";
    
  return  {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": model,
    "messages": [
    {
      "role": "system",
      "content": "You are a professional translator."
    },
      {
        "role": "user",
        "content": `Translate the following text to ${targetLanguage}. You must preserve the    
   exact original formatting including line breaks, spacing, punctuation,      
  capitalization style, and special characters. Only change the language of    
   the words themselves. Do not add any explanations, notes, or additional     
  text:\n\n${query}`
      }
    ]
  }),
}}

// Calculate similarity percentage between two strings
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 100;

  // Levenshtein distance
  const editDistance = getEditDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
};

// Levenshtein distance algorithm
const getEditDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

export const getBestTranslation = async (query: string, targetLanguage: string, sourceLanguage: string) => {
    const models: modelType[] = [
      "openai/gpt-4-turbo",
      "anthropic/claude-3.5-sonnet",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-pro"
    ];

    const startTime = Date.now();

    // Step 1: Translate to target language (parallel)
    const forwardTranslations = await Promise.all(
      models.map(async (model) => {
        const modelStartTime = Date.now();
        const body = getBody(model, query, targetLanguage);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", body);
        const data: any = await response.json();
        
        const translation = data.choices[0]?.message?.content || "";

        return {
          model,
          translation,
          forwardTime: Date.now() - modelStartTime
        };
      })
    );

    // Step 2: Translate back to source language (parallel)
    const backTranslations = await Promise.all(
      forwardTranslations.map(async (item) => {
        const modelStartTime = Date.now();
        const body = getBody(item.model, item.translation, sourceLanguage);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", body);
        const data: any = await response.json();
        const backTranslation = data.choices[0]?.message?.content || "";

        // Calculate similarity to original
        const similarity = calculateSimilarity(query.toLowerCase().trim(), backTranslation.toLowerCase().trim());

        return {
          model: item.model,
          translation: item.translation,
          backTranslation,
          forwardTime: item.forwardTime,
          backwardTime: Date.now() - modelStartTime,
          totalTime: item.forwardTime + (Date.now() - modelStartTime),
          similarityScore: similarity
        };
      })
    );

    // Sort by similarity score (highest is best)
    backTranslations.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      best: backTranslations[0],
      allResults: backTranslations,
      totalTime: Date.now() - startTime,
      originalText: query
    };
  };