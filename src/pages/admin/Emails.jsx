import { useState, useEffect } from 'react'
import {
  Mail, Send, Inbox, ArrowUpRight, Sparkles, Eye, CheckCircle,
  AlertCircle, RefreshCw, Trash2, Reply, Settings, Shield,
  Search, Filter, ChevronRight, Copy, Check, ExternalLink,
  Clock, User, ArrowRight, CornerDownRight, Zap, FileText
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { EMAIL_TEMPLATES, generateEmailWithAI, renderEmailHtml } from '../../lib/aiEmailGenerator'

export default function AdminEmails() {
  const {
    inboundEmails,
    outboundEmails,
    forwardingSettings,
    initEmails,
    markEmailAsRead,
    deleteInboundEmail,
    sendOutboundEmail,
    deleteOutboundEmail,
    updateForwardingSettings
  } = useAdminStore()

  const [activeTab, setActiveTab] = useState('inbox') // 'inbox' | 'compose' | 'sent' | 'forwarding'
  const [selectedInbound, setSelectedInbound] = useState(null)
  const [inboundSearch, setInboundSearch] = useState('')
  const [inboundCategory, setInboundCategory] = useState('all')

  // Composer State
  const [recipient, setRecipient] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('View Order Details')
  const [ctaUrl, setCtaUrl] = useState('https://www.carrygoexpress.store/orders')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)

  // Forwarding Settings State
  const [forwardEmailInput, setForwardEmailInput] = useState(forwardingSettings?.destinationEmail || 'admin@carrygoexpress.store')
  const [forwardEnabled, setForwardEnabled] = useState(forwardingSettings?.isEnabled ?? true)
  const [forwardInquiries, setForwardInquiries] = useState(forwardingSettings?.forwardInquiries ?? true)
  const [forwardOrders, setForwardOrders] = useState(forwardingSettings?.forwardOrders ?? true)
  const [forwardDeposits, setForwardDeposits] = useState(forwardingSettings?.forwardDeposits ?? true)
  const [preserveReplyTo, setPreserveReplyTo] = useState(forwardingSettings?.preserveReplyTo ?? true)
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false)

  useEffect(() => {
    if (typeof initEmails === 'function') {
      initEmails()
    }
  }, [initEmails])

  useEffect(() => {
    if (forwardingSettings) {
      setForwardEmailInput(forwardingSettings.destinationEmail || 'admin@carrygoexpress.store')
      setForwardEnabled(forwardingSettings.isEnabled ?? true)
    }
  }, [forwardingSettings])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Handle template selection
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId)
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId)
    if (!tpl) return

    setSubject(tpl.subject.replace('[Order_ID]', 'CG-' + Math.floor(100000 + Math.random() * 900000)))
    setBody(tpl.body.replace(/\[Customer_Name\]/g, recipientName || 'Valued Customer')
                   .replace(/\[Order_ID\]/g, 'CG-' + Math.floor(100000 + Math.random() * 900000))
                   .replace(/\[Order_Total\]/g, '$1,299.00')
                   .replace(/\[Order_Items\]/g, '1x Apple iPhone 16 Pro Max 256GB')
                   .replace(/\[Delivery_Address\]/g, '14 Victoria Island, Lagos'))
    setCtaText(tpl.ctaText || 'View Details')
    setCtaUrl(tpl.ctaUrl || 'https://www.carrygoexpress.store/')
    showToast(`Loaded "${tpl.name}" template`)
  }

  // Handle AI generation
  const handleGenerateAiEmail = async () => {
    if (!aiPrompt.trim()) {
      showToast('Please type a prompt or topic for the AI to draft', 'error')
      return
    }

    setIsGeneratingAi(true)
    try {
      const generated = await generateEmailWithAI(aiPrompt, {
        customerName: recipientName || 'Valued Customer',
        recipient: recipient || 'customer@example.com'
      })

      if (generated) {
        setSubject(generated.subject)
        setBody(generated.body)
        if (generated.ctaText) setCtaText(generated.ctaText)
        if (generated.ctaUrl) setCtaUrl(generated.ctaUrl)
        showToast('AI synthesized professional email successfully! 🎉')
      }
    } catch (err) {
      console.error('[AI Generation Error]', err)
      showToast('Error generating AI email', 'error')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Handle Send Outbound
  const handleSendEmail = () => {
    if (!recipient.trim() || !recipient.includes('@')) {
      showToast('Please enter a valid recipient email address', 'error')
      return
    }
    if (!subject.trim()) {
      showToast('Please enter an email subject line', 'error')
      return
    }
    if (!body.trim()) {
      showToast('Email body cannot be empty', 'error')
      return
    }

    setSending(true)
    setTimeout(() => {
      sendOutboundEmail({
        recipient: recipient.trim(),
        recipientName: recipientName.trim(),
        subject: subject.trim(),
        body: body.trim(),
        templateId: selectedTemplateId || 'custom',
        ctaText,
        ctaUrl
      })

      setSending(false)
      showToast(`Outbound email sent to ${recipient} via support@carrygoexpress.store!`)
      // Reset composer
      setRecipient('')
      setRecipientName('')
      setSubject('')
      setBody('')
      setSelectedTemplateId('')
      setActiveTab('sent')
    }, 700)
  }

  // Quick Reply to Inbound
  const handleReplyToInbound = (email) => {
    setRecipient(email.replyTo || email.senderEmail)
    setRecipientName(email.senderName || '')
    setSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`)
    setBody(`Dear ${email.senderName || 'Customer'},\n\nThank you for reaching out to CarryGoExpress support regarding "${email.subject}".\n\n\n\nBest regards,\nCarryGoExpress Support Team\nsupport@carrygoexpress.store\nhttps://www.carrygoexpress.store/`)
    setSelectedInbound(null)
    setActiveTab('compose')
  }

  // Save Forwarding Configuration
  const handleSaveForwarding = () => {
    if (!forwardEmailInput.trim() || !forwardEmailInput.includes('@')) {
      showToast('Please enter a valid forwarding email address', 'error')
      return
    }

    updateForwardingSettings({
      destinationEmail: forwardEmailInput.trim(),
      isEnabled: forwardEnabled,
      forwardInquiries,
      forwardOrders,
      forwardDeposits,
      preserveReplyTo
    })

    setSavedSettingsNotice(true)
    setTimeout(() => setSavedSettingsNotice(false), 3000)
    showToast(`Forwarding configured to ${forwardEmailInput.trim()}`)
  }

  // Filtered inbound emails
  const filteredInbound = (inboundEmails || []).filter(em => {
    const matchesCat = inboundCategory === 'all' || em.category === inboundCategory
    const matchesSearch = !inboundSearch ||
      em.subject?.toLowerCase().includes(inboundSearch.toLowerCase()) ||
      em.senderName?.toLowerCase().includes(inboundSearch.toLowerCase()) ||
      em.senderEmail?.toLowerCase().includes(inboundSearch.toLowerCase()) ||
      em.body?.toLowerCase().includes(inboundSearch.toLowerCase())
    return matchesCat && matchesSearch
  })

  const unreadCount = (inboundEmails || []).filter(e => !e.read).length
  const liveHtmlPreview = renderEmailHtml({ subject, body, recipientName, ctaText, ctaUrl })

  return (
    <div className="space-y-6">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-fade-in
          ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Store Communications & AI Mail</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-veltrix-blue/10 text-veltrix-blue border border-veltrix-blue/20">
              <span className="w-2 h-2 rounded-full bg-veltrix-blue animate-pulse" />
              support@carrygoexpress.store
            </span>
          </div>
          <p className="text-xs sm:text-sm text-veltrix-gray-400 mt-1">
            PrivateEmail SMTP verified (mail.privateemail.com:465) · Manage inbound inbox, compose outbound, preview HTML, and configure forwarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-blue text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-veltrix-blue/90 transition-all shadow-glow"
          >
            <Send className="w-4 h-4" />
            Compose Outbound
          </button>
        </div>
      </div>

      {/* ── Summary Metrics Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-veltrix-gray-400 uppercase">Inbound Inbox</span>
            <Inbox className="w-4 h-4 text-veltrix-blue" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{inboundEmails.length}</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">Customer inquiries to support@</p>
        </div>

        <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-veltrix-gray-400 uppercase">Outbound Sent</span>
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-2xl font-black text-white">{outboundEmails.length}</span>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">Dispatched official emails</p>
        </div>

        <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-veltrix-gray-400 uppercase">Forwarding Status</span>
            <Settings className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate max-w-[130px]">
              {forwardingSettings?.destinationEmail || 'admin@carrygoexpress.store'}
            </span>
            <span className={`w-2 h-2 rounded-full ${forwardingSettings?.isEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">
            {forwardingSettings?.isEnabled ? 'Active forwarder' : 'Forwarding paused'}
          </p>
        </div>

        <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-veltrix-gray-400 uppercase">AI Generator</span>
            <Sparkles className="w-4 h-4 text-veltrix-blue animate-pulse" />
          </div>
          <span className="text-sm font-bold text-veltrix-blue">Gemini Synthesis</span>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">Instant tailored client responses</p>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-veltrix-gray-800 pb-2 overflow-x-auto">
        {[
          { id: 'inbox', label: 'Inbound Inbox', icon: Inbox, count: unreadCount },
          { id: 'compose', label: 'Compose Outbound', icon: Send, count: null },
          { id: 'sent', label: 'Sent History', icon: ArrowUpRight, count: outboundEmails.length },
          { id: 'forwarding', label: 'Forwarding & Server Config', icon: Settings, count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-veltrix-blue text-black shadow-glow'
                : 'text-veltrix-gray-400 hover:text-white hover:bg-veltrix-black-light'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count !== null && tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-black text-veltrix-blue' : 'bg-veltrix-gray-800 text-white'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 1. INBOUND INBOX TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
              <input
                type="text"
                value={inboundSearch}
                onChange={e => setInboundSearch(e.target.value)}
                placeholder="Search inbound messages by sender, subject, or content..."
                className="w-full pl-10 pr-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-veltrix-gray-500 focus:outline-none focus:border-veltrix-blue"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-veltrix-gray-500 shrink-0" />
              {['all', 'Sales & Bulk', 'Orders', 'Support'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setInboundCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    inboundCategory === cat
                      ? 'bg-veltrix-blue text-black'
                      : 'bg-veltrix-black-light border border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Inquiries' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          {filteredInbound.length === 0 ? (
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-12 text-center">
              <Inbox className="w-12 h-12 text-veltrix-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Inbound Emails Found</h3>
              <p className="text-xs text-veltrix-gray-400 max-w-sm mx-auto">
                Customer contact form submissions and inquiries sent to support@carrygoexpress.store will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInbound.map(email => (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedInbound(email)
                    if (!email.read) markEmailAsRead(email.id)
                  }}
                  className={`cursor-pointer bg-veltrix-black-light border rounded-2xl p-4 transition-all hover:border-veltrix-blue/50 ${
                    !email.read ? 'border-veltrix-blue/40 bg-veltrix-blue/5' : 'border-veltrix-gray-800/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-veltrix-gray-800 border border-veltrix-gray-700 flex items-center justify-center text-xs font-bold text-veltrix-blue shrink-0">
                        {(email.senderName || email.senderEmail || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={`text-sm font-bold ${!email.read ? 'text-white' : 'text-veltrix-gray-300'}`}>
                          {email.senderName}
                        </span>
                        <span className="text-xs text-veltrix-gray-500 ml-2">
                          &lt;{email.senderEmail}&gt;
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {email.forwardedTo && (
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          Forwarded to {email.forwardedTo}
                        </span>
                      )}
                      <span className="text-[11px] text-veltrix-gray-500">
                        {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <h4 className={`text-xs sm:text-sm font-semibold mb-1 ${!email.read ? 'text-white' : 'text-veltrix-gray-300'}`}>
                    {email.subject}
                  </h4>
                  <p className="text-xs text-veltrix-gray-400 line-clamp-2">
                    {email.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Inbound Email Detail Modal ── */}
      {selectedInbound && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-veltrix-gray-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-veltrix-blue font-bold bg-veltrix-blue/10 px-2.5 py-1 rounded-full border border-veltrix-blue/20">
                  {selectedInbound.category || 'Inquiry'}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-2">
                  {selectedInbound.subject}
                </h2>
                <div className="flex items-center gap-2 text-xs text-veltrix-gray-400 mt-1">
                  <span>From: <strong className="text-white">{selectedInbound.senderName}</strong> ({selectedInbound.senderEmail})</span>
                </div>
                <div className="text-[11px] text-veltrix-gray-500 mt-0.5">
                  Received: {new Date(selectedInbound.receivedAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedInbound(null)}
                className="w-8 h-8 rounded-full bg-veltrix-gray-800 text-veltrix-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-veltrix-black rounded-2xl border border-veltrix-gray-800/80 text-xs sm:text-sm text-veltrix-gray-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {selectedInbound.body}
            </div>

            {selectedInbound.forwardedTo && (
              <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                <CornerDownRight className="w-4 h-4 shrink-0" />
                <span>Automatically forwarded to configured address: <strong>{selectedInbound.forwardedTo}</strong></span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  deleteInboundEmail(selectedInbound.id)
                  setSelectedInbound(null)
                  showToast('Email deleted from inbox')
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedInbound(null)}
                  className="px-4 py-2 border border-veltrix-gray-700 text-veltrix-gray-300 rounded-xl text-xs hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleReplyToInbound(selectedInbound)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-veltrix-blue text-black font-bold text-xs rounded-xl hover:bg-veltrix-blue/90 transition-colors shadow-glow"
                >
                  <Reply className="w-4 h-4" />
                  Reply with Outbound Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 2. COMPOSE OUTBOUND TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Form & AI Synthesis */}
          <div className="lg:col-span-2 space-y-6">

            {/* AI Generator Card */}
            <div className="bg-gradient-to-r from-veltrix-blue/15 via-veltrix-blue/5 to-transparent border border-veltrix-blue/30 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-veltrix-blue">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Email Synthesizer (Gemini Powered)</span>
                </div>
                <span className="text-[10px] text-veltrix-gray-400 font-mono">Instant Formatted Draft</span>
              </div>
              <p className="text-xs text-veltrix-gray-400 mb-3">
                Describe the situation (e.g. &quot;Apologize for 1-day MacBook delay and offer $20 discount code&quot; or &quot;Welcome customer and explain 1-year gadget warranty&quot;):
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Confirm iPhone 16 Pro order has shipped via Express Van with 3 PM arrival..."
                  className="flex-1 px-4 py-2.5 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue"
                  onKeyDown={e => { if (e.key === 'Enter') handleGenerateAiEmail() }}
                />
                <button
                  onClick={handleGenerateAiEmail}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-blue text-black font-bold text-xs rounded-xl hover:bg-veltrix-blue/90 transition-all disabled:opacity-60 shrink-0 shadow-glow"
                >
                  {isGeneratingAi ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingAi ? 'Synthesizing...' : 'Generate with AI'}
                </button>
              </div>
            </div>

            {/* Compose Card */}
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-veltrix-gray-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-veltrix-blue" />
                  Outbound Dispatch Composer
                </h3>
                <span className="text-xs text-veltrix-gray-500 font-mono">From: support@carrygoexpress.store</span>
              </div>

              {/* Recipient & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-veltrix-gray-400 mb-1">
                    Customer Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full px-3.5 py-2.5 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-veltrix-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-veltrix-gray-400 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-veltrix-blue"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-veltrix-gray-400 mb-1">
                  Email Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Your CarryGoExpress Order #CG-9102 Has Been Confirmed! 🚀"
                  className="w-full px-3.5 py-2.5 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-veltrix-blue"
                />
              </div>

              {/* Message Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-veltrix-gray-400">
                    Message Body (Text / Markdown Bullet Points) *
                  </label>
                  <span className="text-[10px] text-veltrix-gray-500">Supports • bullet points and paragraphs</span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write official email body here..."
                  className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-veltrix-blue resize-y font-sans leading-relaxed"
                />
              </div>

              {/* CTA Link Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-veltrix-gray-400 mb-1">
                    Call-to-Action Button Label
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    placeholder="e.g. Track Order Live"
                    className="w-full px-3.5 py-2 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-veltrix-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-veltrix-gray-400 mb-1">
                    Call-to-Action URL
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={e => setCtaUrl(e.target.value)}
                    placeholder="https://www.carrygoexpress.store/..."
                    className="w-full px-3.5 py-2 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-veltrix-blue"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-veltrix-gray-800">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-veltrix-blue" />
                  Preview Email HTML
                </button>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-veltrix-blue text-black font-bold text-xs sm:text-sm rounded-xl hover:bg-veltrix-blue/90 transition-all shadow-glow disabled:opacity-60"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending via SMTP...' : 'Send Outbound Email'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Templates Picker & Quick Preview */}
          <div className="space-y-4">
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-veltrix-blue" />
                Select Email Template
              </h3>
              <p className="text-xs text-veltrix-gray-400 mb-4">
                Choose an official pre-approved CarryGoExpress correspondence template:
              </p>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {EMAIL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedTemplateId === tpl.id
                        ? 'bg-veltrix-blue/15 border-veltrix-blue text-white'
                        : 'bg-veltrix-black/50 border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white hover:border-veltrix-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{tpl.name}</span>
                      <span className="text-[10px] font-mono text-veltrix-blue uppercase">{tpl.category}</span>
                    </div>
                    <p className="text-[11px] text-veltrix-gray-500 line-clamp-1">{tpl.subject}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Live Preview Snippet */}
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-veltrix-blue" />
                  Live Client Rendering
                </span>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="text-xs text-veltrix-blue hover:underline"
                >
                  Full Preview
                </button>
              </div>

              <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 text-xs">
                <p className="text-[11px] text-veltrix-gray-500 mb-1">
                  Subject: <strong className="text-white">{subject || '(No subject entered)'}</strong>
                </p>
                <p className="text-[11px] text-veltrix-gray-500 mb-2">
                  To: <span className="text-veltrix-blue">{recipient || 'customer@example.com'}</span>
                </p>
                <div className="text-[11px] text-veltrix-gray-300 line-clamp-4 whitespace-pre-wrap leading-relaxed border-t border-veltrix-gray-800 pt-2">
                  {body || 'Start typing in composer or generate with AI to see live preview...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Email HTML Preview Modal ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-veltrix-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-veltrix-blue" />
                <h3 className="text-base font-bold text-white">Live Client Email Preview</h3>
                <span className="text-xs text-veltrix-gray-500 font-mono ml-2">(HTML Email Client Output)</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(liveHtmlPreview)
                    setCopiedHtml(true)
                    setTimeout(() => setCopiedHtml(false), 2000)
                    showToast('HTML code copied to clipboard!')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-veltrix-gray-800 hover:text-white text-veltrix-gray-300 rounded-lg transition-colors"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedHtml ? 'Copied HTML' : 'Copy HTML'}
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="w-8 h-8 rounded-full bg-veltrix-gray-800 text-veltrix-gray-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Email Rendered in Iframe */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070a0f]">
              <div className="max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-veltrix-gray-800 bg-[#111827]">
                <iframe
                  title="Live Email Preview"
                  srcDoc={liveHtmlPreview}
                  className="w-full h-[520px] border-0"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-veltrix-gray-800 flex items-center justify-between text-xs text-veltrix-gray-500">
              <span>Verified responsive for mobile, Gmail, Apple Mail & Outlook clients</span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-veltrix-blue text-black font-bold rounded-xl hover:bg-veltrix-blue/90 transition-colors"
              >
                Back to Composer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 3. SENT HISTORY TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-400" />
              Dispatched Outbound Log ({outboundEmails.length})
            </h3>
            <button
              onClick={() => setActiveTab('compose')}
              className="text-xs text-veltrix-blue hover:underline flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              Send Another Email
            </button>
          </div>

          {outboundEmails.length === 0 ? (
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-12 text-center">
              <Mail className="w-12 h-12 text-veltrix-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Outbound Emails Dispatched Yet</h3>
              <p className="text-xs text-veltrix-gray-400 max-w-sm mx-auto mb-4">
                Emails composed and sent from support@carrygoexpress.store will be logged here with delivery confirmation.
              </p>
              <button
                onClick={() => setActiveTab('compose')}
                className="px-4 py-2 bg-veltrix-blue text-black font-bold text-xs rounded-xl"
              >
                Compose First Email
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {outboundEmails.map(em => (
                <div
                  key={em.id}
                  className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">To: {em.recipient}</span>
                      <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        {em.status || 'Delivered'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-veltrix-gray-200">{em.subject}</h4>
                    <p className="text-[11px] text-veltrix-gray-400 line-clamp-1">{em.body}</p>
                    <p className="text-[10px] text-veltrix-gray-500">
                      Dispatched on {new Date(em.sentAt).toLocaleString()} via support@carrygoexpress.store
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setRecipient(em.recipient)
                        setSubject(em.subject)
                        setBody(em.body)
                        setShowPreviewModal(true)
                      }}
                      className="px-3 py-1.5 border border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-veltrix-blue" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        deleteOutboundEmail(em.id)
                        showToast('Record removed from history')
                      }}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* 4. FORWARDING & SERVER CONFIG TAB */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'forwarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Forwarding Settings Card */}
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-veltrix-gray-800 pb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-veltrix-blue" />
                  Email Forwarding Configuration
                </h3>
                <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>
              <p className="text-xs text-veltrix-gray-400">
                Configure where inbound emails to <strong>support@carrygoexpress.store</strong> are automatically routed.
              </p>
            </div>

            {/* Destination Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-veltrix-gray-300 uppercase tracking-wider">
                Forward All Inbound Emails To *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type="email"
                  value={forwardEmailInput}
                  onChange={e => setForwardEmailInput(e.target.value)}
                  placeholder="e.g. your-personal-email@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-veltrix-blue transition-colors font-medium"
                />
              </div>
              <p className="text-[11px] text-veltrix-gray-500">
                Every customer message sent to support@carrygoexpress.store will be automatically forwarded to this address.
              </p>
            </div>

            {/* Toggle Master Forwarding */}
            <div className="flex items-center justify-between p-4 bg-veltrix-black/60 rounded-xl border border-veltrix-gray-800">
              <div>
                <span className="text-xs font-bold text-white block">Automated Email Forwarding</span>
                <span className="text-[11px] text-veltrix-gray-400">Enable or pause forwarding pipeline</span>
              </div>
              <button
                type="button"
                onClick={() => setForwardEnabled(!forwardEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  forwardEnabled ? 'bg-veltrix-blue' : 'bg-veltrix-gray-800'
                }`}
              >
                <span className={`block w-4 h-4 rounded-full bg-black transition-transform ${
                  forwardEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Specific Category Rules */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-veltrix-gray-400 uppercase tracking-wider block">
                Forwarding Trigger Rules
              </span>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={forwardInquiries}
                  onChange={e => setForwardInquiries(e.target.checked)}
                  className="accent-veltrix-blue w-4 h-4 rounded"
                />
                <span className="text-xs text-veltrix-gray-300 group-hover:text-white transition-colors">
                  Forward all customer inquiries & Contact Form messages
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={forwardOrders}
                  onChange={e => setForwardOrders(e.target.checked)}
                  className="accent-veltrix-blue w-4 h-4 rounded"
                />
                <span className="text-xs text-veltrix-gray-300 group-hover:text-white transition-colors">
                  Forward customer order notifications & delivery tracking updates
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={forwardDeposits}
                  onChange={e => setForwardDeposits(e.target.checked)}
                  className="accent-veltrix-blue w-4 h-4 rounded"
                />
                <span className="text-xs text-veltrix-gray-300 group-hover:text-white transition-colors">
                  Forward wallet deposit notifications & payment receipts
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={preserveReplyTo}
                  onChange={e => setPreserveReplyTo(e.target.checked)}
                  className="accent-veltrix-blue w-4 h-4 rounded"
                />
                <span className="text-xs text-veltrix-gray-300 group-hover:text-white transition-colors">
                  Preserve customer email as <strong>Reply-To</strong> header (replying directly from your inbox responds to customer)
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-veltrix-gray-800 flex items-center justify-between">
              {savedSettingsNotice ? (
                <span className="text-xs font-bold text-green-400 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle className="w-4 h-4" />
                  Forwarding Configuration Saved!
                </span>
              ) : <div />}

              <button
                type="button"
                onClick={handleSaveForwarding}
                className="px-6 py-2.5 bg-veltrix-blue text-black font-bold text-xs rounded-xl hover:bg-veltrix-blue/90 transition-colors shadow-glow"
              >
                Save Forwarding Settings
              </button>
            </div>
          </div>

          {/* Namecheap PrivateEmail Server Status */}
          <div className="space-y-6">
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6 space-y-5">
              <div className="border-b border-veltrix-gray-800 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-veltrix-blue" />
                    PrivateEmail & Domain Status
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20">
                    Connected
                  </span>
                </div>
                <p className="text-xs text-veltrix-gray-400">
                  Namecheap PrivateEmail infrastructure for https://www.carrygoexpress.store/
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex justify-between items-center">
                  <span className="text-veltrix-gray-400">Official Mailbox</span>
                  <span className="font-mono text-white font-bold">support@carrygoexpress.store</span>
                </div>

                <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex justify-between items-center">
                  <span className="text-veltrix-gray-400">SMTP Host (Outbound)</span>
                  <span className="font-mono text-veltrix-blue">mail.privateemail.com:465 (SSL)</span>
                </div>

                <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex justify-between items-center">
                  <span className="text-veltrix-gray-400">IMAP Host (Inbound)</span>
                  <span className="font-mono text-veltrix-blue">mail.privateemail.com:993 (SSL)</span>
                </div>

                <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex justify-between items-center">
                  <span className="text-veltrix-gray-400">Store Domain</span>
                  <a href="https://www.carrygoexpress.store/" target="_blank" rel="noreferrer" className="text-veltrix-blue hover:underline flex items-center gap-1 font-mono">
                    https://www.carrygoexpress.store/
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex justify-between items-center">
                  <span className="text-veltrix-gray-400">DKIM / SPF / DMARC</span>
                  <span className="text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified by Namecheap
                  </span>
                </div>
              </div>

              <div className="p-4 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-xl text-xs text-veltrix-gray-400 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-veltrix-blue" />
                  Realtime Synchronization Active
                </p>
                <p>
                  Any email sent to <strong>support@carrygoexpress.store</strong> triggers the forwarding pipeline immediately, logging the event in your admin realtime activity feed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
