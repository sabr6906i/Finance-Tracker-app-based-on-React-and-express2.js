import Groq from 'groq-sdk'

let groq = null

function getGroq() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groq
}

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT_MODEL = 'llama-3.1-8b-instant'

export function extractJSON(text) {
  // Try direct parse first
  try { return JSON.parse(text) } catch {}
  // Try extracting from markdown code block
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) {
    try { return JSON.parse(match[1].trim()) } catch {}
  }
  // Try finding first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }
  return null
}

/**
 * Analyze a receipt/bill image and extract transaction data
 */
export async function analyzeReceiptImage(base64Image, mimeType, userPatterns = []) {
  const systemPrompt = `You are a financial assistant that analyzes receipt and bill images.

Extract the following information from the image:
- Amount (as a number)
- Type: 'income' or 'expense' (assume 'expense' unless it's clearly income like a salary deposit)
- Category: One of: Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Education, Salary, Freelance, Other
- categoryConfident: true if you are confident about the category, false if uncertain (e.g. unclear merchant, ambiguous description)
- Timestamp: The date from the receipt in YYYY-MM-DD format (if not found, use today's date)
- Description/Note: A brief description of the transaction (e.g., "Coffee at Starbucks", "Electricity bill")

User's learned payment patterns:
${userPatterns.map((p) => `- "${p.label}": keywords=[${p.keywords}], category=${p.category}, type=${p.type}`).join('\n')}

IMPORTANT: If the category is unclear or ambiguous, set "categoryConfident": false so the user can choose the right category.

Respond ONLY with valid JSON in this exact format (no markdown, no backticks):
{
  "transactions": [
    {
      "amount": 450.50,
      "type": "expense",
      "category": "Food",
      "categoryConfident": true,
      "timestamp": "2025-04-10",
      "description": "Coffee and pastry"
    }
  ],
  "confidence": 0.95,
  "warnings": ["Could not detect exact amount", "Date is unclear"]
}

If you cannot identify a valid transaction, return: {"transactions": [], "confidence": 0, "warnings": ["Could not parse receipt"]}`

  try {
    const response = await getGroq().chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this receipt/bill image and extract the transaction information.',
            },
          ],
        },
      ],
    })

    const text = response.choices[0].message.content
    const result = extractJSON(text)
    if (!result) {
      return { transactions: [], confidence: 0, warnings: ['Could not parse model response as JSON'] }
    }
    return result
  } catch (error) {
    console.error('Error analyzing receipt:', error.message)
    throw new Error(`Failed to analyze receipt: ${error.message}`)
  }
}

/**
 * Analyze a CSV (bank statement) and extract transactions
 */
export async function analyzeCSV(csvText, userPatterns = []) {
  const systemPrompt = `You are a financial assistant that parses bank/UPI transaction CSVs.

Supported formats:
- Paytm transactions (columns: Transaction Date, Amount, Type, Description)
- UPI app exports (columns: Date, Amount, Type/Status, Recipient/Merchant)
- Generic bank statements (Date, Amount, Description, Type)

User's learned payment patterns:
${userPatterns.map((p) => `- "${p.label}": keywords=[${p.keywords}], category=${p.category}, type=${p.type}`).join('\n')}

For each transaction row in the CSV:
1. Extract: amount, date (YYYY-MM-DD), description, type (income/expense)
2. Infer category based on description and user patterns. Use one of: Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Education, Salary, Freelance, Other
3. Set "categoryConfident": true if you are sure about the category, false if the description is ambiguous or unclear
4. Return as structured JSON

IMPORTANT: If the category is unclear or ambiguous, set "categoryConfident": false so the user can choose the right category.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "transactions": [
    {
      "amount": 500,
      "type": "expense",
      "category": "Food",
      "categoryConfident": true,
      "timestamp": "2025-04-10",
      "description": "Swiggy - Food delivery"
    }
  ],
  "warnings": ["Could not parse 2 rows", "Unknown format detected"],
  "metadata": {
    "totalRows": 10,
    "successfulParses": 8,
    "skippedRows": 2
  }
}`

  try {
    const response = await getGroq().chat.completions.create({
      model: TEXT_MODEL,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please analyze this CSV and extract all transactions:\n\n${csvText}`,
        },
      ],
    })

    const text = response.choices[0].message.content
    const result = extractJSON(text)
    if (!result) {
      return { transactions: [], warnings: ['Could not parse model response as JSON'], metadata: {} }
    }
    return result
  } catch (error) {
    console.error('Error analyzing CSV:', error.message)
    throw new Error(`Failed to analyze CSV: ${error.message}`)
  }
}

/**
 * Chat with the assistant with transaction context
 */
export async function chatWithContext(userMessage, transactionSummary, userPatterns = [], recentTransactions = []) {
  const transactionContext = `
User's transaction summary:
${transactionSummary}

Recent transactions (last 10):
${recentTransactions
  .slice(0, 10)
  .map((tx) => `- ${tx.timestamp}: ${tx.type === 'income' ? '+' : '-'} ₹${tx.amount} (${tx.category}) - ${tx.note}`)
  .join('\n')}

User's learned patterns:
${userPatterns.map((p) => `- "${p.label}": ${p.category}, ${p.type}`).join('\n')}
`

  const systemPrompt = `You are a friendly financial assistant helping users manage their personal finances.

You can:
1. Answer questions about their spending patterns (e.g., "How much did I spend on food?")
2. Provide insights on their financial habits
3. Suggest budgets and savings tips
4. Warn about unusual spending patterns
5. Help categorize transactions
6. Provide natural language queries like "show me food expenses this week"
7. ADD transactions when the user asks (e.g., "add 60 rs frankie", "spent 200 on groceries", "earned 5000 salary")

IMPORTANT — Adding transactions:
When the user wants to add/record a transaction, you MUST respond with ONLY valid JSON in this format:
{
  "action": "add_transaction",
  "transactions": [
    {
      "amount": 60,
      "type": "expense",
      "category": "Food",
      "categoryConfident": true,
      "timestamp": "${new Date().toISOString().split('T')[0]}",
      "description": "Frankie"
    }
  ],
  "message": "Adding ₹60 expense for Frankie under Food category."
}

Rules for adding:
- Use today's date unless the user specifies a date
- If the category is unclear, set "categoryConfident": false and "category": "Other"
- Available categories: Food, Transport, Entertainment, Utilities, Healthcare, Shopping, Education, Salary, Freelance, Other
- Detect type: keywords like "earned", "received", "salary", "income" = income. Everything else = expense.
- Include a friendly "message" confirming what you're adding

For all OTHER queries (questions, insights, etc.), respond with plain text as usual — do NOT wrap regular responses in JSON.

${transactionContext}

Be concise, helpful, and honest. If you don't have enough data, say so.`

  try {
    const response = await getGroq().chat.completions.create({
      model: TEXT_MODEL,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    return {
      reply: response.choices[0].message.content,
      warnings: [],
    }
  } catch (error) {
    console.error('Error in chat:', error.message)
    throw new Error(`Failed to process chat: ${error.message}`)
  }
}

/**
 * Detect unusual spending patterns and generate warnings
 */
export async function detectSpendingWarnings(transactions) {
  if (transactions.length === 0) return []

  const systemPrompt = `You are a financial advisor analyzing spending patterns.

Analyze the provided transactions and identify:
1. Recurring unnecessary expenses (e.g., daily coffee, multiple clothing purchases per month)
2. Spending spikes above average for a category
3. Potential subscription services that might be unused
4. Unusual frequency patterns

Return a JSON array of warnings:
{
  "warnings": [
    "You spent ₹2000 on Food in the last 3 days - this is 50% above your weekly average",
    "You have 4 food delivery purchases in 2 days - consider cooking at home"
  ]
}`

  try {
    const txList = transactions
      .map((tx) => `${tx.timestamp}: ${tx.type} ₹${tx.amount} (${tx.category}) - ${tx.note}`)
      .join('\n')

    const response = await getGroq().chat.completions.create({
      model: TEXT_MODEL,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze these transactions and generate spending warnings:\n\n${txList}`,
        },
      ],
    })

    const text = response.choices[0].message.content
    const result = extractJSON(text)
    return result?.warnings || []
  } catch (error) {
    console.error('Error detecting warnings:', error.message)
    return []
  }
}

export default {
  analyzeReceiptImage,
  analyzeCSV,
  chatWithContext,
  detectSpendingWarnings,
  extractJSON,
}
