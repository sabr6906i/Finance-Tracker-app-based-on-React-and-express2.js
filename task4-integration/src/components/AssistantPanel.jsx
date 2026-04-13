import { useState, useEffect, useRef } from 'react'
import * as api from '../api'

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Education', 'Salary', 'Freelance', 'Other']

export default function AssistantPanel({ transactions, onTransactionsAdded }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingTransactions, setPendingTransactions] = useState([])
  const [uploadPreview, setUploadPreview] = useState(null)
  const messagesEndRef = useRef(null)
  const imageInputRef = useRef(null)
  const csvInputRef = useRef(null)

  // Load message history on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await api.getMessages()
        setMessages(data.messages || [])
      } catch (err) {
        console.error('Error loading messages:', err)
      }
    }
    loadMessages()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingTransactions])

  const addMessage = (role, content, metadata = {}) => {
    const msg = {
      role,
      content,
      metadata,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMsg = inputValue.trim()
    setInputValue('')
    addMessage('user', userMsg)
    setIsLoading(true)

    try {
      const result = await api.sendChat(userMsg)
      const meta = result.message.metadata ? JSON.parse(result.message.metadata) : {}

      // If the LLM returned transactions to add, show preview cards
      if (result.pendingTransactions?.length > 0) {
        meta.transactions = result.pendingTransactions
        addMessage('assistant', result.message.content, meta)
        setPendingTransactions(result.pendingTransactions)
      } else {
        addMessage('assistant', result.message.content, meta)
      }
    } catch (err) {
      addMessage('assistant', `Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const mimeType = file.type || 'image/jpeg'

    // Read file as data URL (base64)
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.readAsDataURL(file)
    })

    // Show preview
    setUploadPreview({ type: 'image', src: dataUrl })

    // Extract raw base64 (remove "data:image/jpeg;base64," prefix)
    const base64 = dataUrl.split(',')[1]

    addMessage('user', `Uploaded image: ${file.name}`)
    setIsLoading(true)

    try {
      const result = await api.analyzeImage(base64, mimeType)
      addMessage('assistant', `Found ${result.transactions.length} transaction(s) in the receipt.`, {
        transactions: result.transactions,
        confidence: result.confidence,
        warnings: result.warnings,
      })

      if (result.transactions.length > 0) {
        setPendingTransactions(result.transactions)
      }
    } catch (err) {
      addMessage('assistant', `Error analyzing image: ${err.message}`)
    } finally {
      setIsLoading(false)
      setUploadPreview(null)
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const csvText = event.target.result
      addMessage('user', `📄 Uploaded CSV: ${file.name}`)
      setIsLoading(true)

      try {
        const result = await api.analyzeCSV(csvText)
        const message = `Found ${result.transactions.length} new transaction(s)${
          result.duplicates.length > 0 ? `, ${result.duplicates.length} duplicate(s)` : ''
        }.`
        addMessage('assistant', message, {
          transactions: result.transactions,
          duplicates: result.duplicates,
          warnings: result.warnings,
        })

        if (result.transactions.length > 0) {
          setPendingTransactions(result.transactions)
        }
      } catch (err) {
        addMessage('assistant', `Error analyzing CSV: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    reader.readAsText(file)

    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = ''
    }
  }

  const confirmTransactions = async (txList) => {
    if (txList.length === 0) return

    setIsLoading(true)
    try {
      const normalized = txList.map((tx) => ({
        amount: Number(tx.amount),
        type: tx.type,
        category: tx.category,
        timestamp: tx.timestamp,
        description: tx.description || tx.note || '',
      }))

      const result = await api.confirmTransactions(normalized)

      if (result.inserted.length > 0) {
        addMessage(
          'assistant',
          `✅ Successfully added ${result.inserted.length} transaction(s). ${
            result.errors.length > 0 ? `⚠️ ${result.errors.length} error(s).` : ''
          }`
        )
        setPendingTransactions([])
        onTransactionsAdded()
      }

      if (result.errors.length > 0) {
        addMessage('assistant', `Errors: ${result.errors.join(' | ')}`)
      }
    } catch (err) {
      addMessage('assistant', `Error confirming transactions: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const skipTransaction = (index) => {
    setPendingTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  const updatePendingTransaction = (index, updates) => {
    setPendingTransactions((prev) => {
      const newList = [...prev]
      newList[index] = { ...newList[index], ...updates }
      return newList
    })
  }

  return (
    <div className="assistant-panel">
      <div className="assistant-header">
        <h3>🤖 AI Assistant</h3>
        <span className="model-badge">Groq</span>
      </div>

      <div className="assistant-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`msg msg-${msg.role}`}>
            <div className="msg-content">{msg.content}</div>
          </div>
        ))}

        {/* Pending transactions preview — rendered from state so edits are reflected */}
        {pendingTransactions.length > 0 && (
          <div className="tx-preview-list">
            {pendingTransactions.map((tx, txIdx) => (
              <div key={txIdx} className="tx-preview-card">
                <div className="tx-preview-header">
                  <span className={`tx-amount tx-${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'} ₹{Number(tx.amount).toFixed(2)}
                  </span>
                  {tx.categoryConfident === false ? (
                    <select
                      className="tx-category-select"
                      value={tx.category || 'Other'}
                      onChange={(e) =>
                        updatePendingTransaction(txIdx, { category: e.target.value, categoryConfident: true })
                      }
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="tx-category">{tx.category}</span>
                  )}
                </div>

                {tx.categoryConfident === false && (
                  <div className="tx-category-hint">⚠ Please select the correct category</div>
                )}

                <input
                  type="text"
                  placeholder="Description"
                  value={tx.description || ''}
                  onChange={(e) =>
                    updatePendingTransaction(txIdx, { description: e.target.value })
                  }
                  className="tx-preview-input"
                />

                <input
                  type="date"
                  value={tx.timestamp || ''}
                  onChange={(e) =>
                    updatePendingTransaction(txIdx, { timestamp: e.target.value })
                  }
                  className="tx-preview-input"
                />

                <div className="tx-preview-actions">
                  <button
                    className="btn-confirm"
                    onClick={() => confirmTransactions([tx])}
                    disabled={isLoading}
                  >
                    ✓ Add
                  </button>
                  <button
                    className="btn-skip"
                    onClick={() => skipTransaction(txIdx)}
                  >
                    ✕ Skip
                  </button>
                </div>
              </div>
            ))}

            <button
              className="btn-confirm-all"
              onClick={() => confirmTransactions(pendingTransactions)}
              disabled={isLoading}
            >
              ✓ Confirm All
            </button>
          </div>
        )}

        {isLoading && <div className="msg msg-assistant msg-loading">Thinking...</div>}

        <div ref={messagesEndRef} />
      </div>

      {uploadPreview && (
        <div className="upload-preview">
          <img src={uploadPreview.src} alt="Preview" className="preview-img" />
        </div>
      )}

      <div className="assistant-input-area">
        <div className="upload-row">
          <button className="btn-upload" onClick={() => imageInputRef.current?.click()}>
            📷 Image
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />

          <button className="btn-upload" onClick={() => csvInputRef.current?.click()}>
            📄 CSV
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="chat-row">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Ask anything... (Enter to send)"
            className="assistant-input"
            disabled={isLoading}
          />
          <button className="btn-send" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
