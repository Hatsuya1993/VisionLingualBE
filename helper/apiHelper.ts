import Stripe from "stripe";

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

export const getSourceLanguage = async (text: string): Promise<string> => {

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "openai/gpt-4-turbo",
    "messages": [{
      "role": "user",
      "content": `Detect the language of this text and respond with ONLY the
language name in English (e.g., "English", "Spanish", "Japanese"): "${text}"`
    }]
  })
});
const data: any = await response.json();
return data.choices[0]?.message?.content.trim() || "English";

}

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

export const getExtractText = async (imageFile: Express.Multer.File) => {

    // Convert image buffer to base64
  const base64Image = imageFile.buffer.toString('base64');
  const mimeType = imageFile.mimetype;

  // Call OpenRouter API
  const response = await
  fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: `Extract all text from this image. Return only text.`
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
  const error : any = await response.json();
  console.error('OpenRouter error:', error);
  throw new Error(`OpenRouter API error: ${error.error?.message || 'Unknown error'}`);
}

  const data : any = await response.json();
  const translatedText = data.choices[0].message.content;

  return translatedText;

}

export const handleStripeSession = async (plan : string, domain : string) => {

  if(!process.env.STRIPE_API_KEY) {
    throw new Error("Missing Stripe API key");
  }

  let id 

  if(plan.toLowerCase() === "pro") {
    id = "price_1SFTLu2dE0QXKFAFoyCkNqzO"
  }
  else if(plan.toLowerCase() === "premium") {
    id = "price_1SFTMI2dE0QXKFAFj27fue7L"
  }
  else if(plan.toLowerCase() === "enterprise") {
    id = "price_1SFTMq2dE0QXKFAFPN5tiVwB" 
  }
  else {
    throw new Error("Invalid plan");
  }  

  const stripe = new Stripe(process.env.STRIPE_API_KEY)
  
  try {
   
    const session = await stripe.checkout.sessions.create({
    line_items: [{
      price: id,
      quantity: 1
    }],
    mode: "subscription",
    success_url: `${domain}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}?canceled=true`,
    metadata: {
      planType: plan.toLowerCase()
    }
  })
  
  if(session.url) {
    return session.url
  }

  throw new Error("No Stripe session found")

  } catch (error) {

    throw new Error("Something happen during Stripe session create : " + error)
    
  }

}


export const handleVerifyingPayment = async (sesionId : string) => {

  if(!process.env.STRIPE_API_KEY) {
    throw new Error("Missing Stripe API key");
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_API_KEY)
    const session = await stripe.checkout.sessions.retrieve(sesionId)

    if(session.payment_status === "paid" && session.subscription) {
      // Retrieve full subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);      

      return {
          success: true,
          planType: session.metadata?.planType || null,
          customerEmail: session.customer_details?.email || null,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status, // 'active', 'canceled', 'past_due', etc.
          subscriptionEndDate: new Date(subscription.items.data[0].current_period_end * 1000).toISOString().split('T')[0]
        };
    }

    return {
      success: false,
      planType: null,
      customerEmail: null,
      subscriptionId: null,
      subscriptionStatus: null,
      subscriptionEndDate: null
    }
    
  } catch (error) {
    throw new Error("Something happen during session retrieve Stripe " + error)
  }
}

export const handleCheckingSubscription = async (subscriptionId : string) => {

  if(!process.env.STRIPE_API_KEY) {
    throw new Error("Missing Stripe API key");
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_API_KEY);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      isActive: subscription.status === 'active',
      status: subscription.status, // 'active', 'canceled', 'past_due', 'unpaid', 'incomplete', etc.
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000).toISOString().split('T')[0],
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planId: subscription.items.data[0]?.price.id || null,
      customerId: subscription.customer
    };

  } catch (error) {
    throw new Error("Failed to retrieve subscription: " + error);
  }

}