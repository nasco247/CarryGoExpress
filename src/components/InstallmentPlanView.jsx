import { useState } from 'react'
import { 
  CreditCard, Calendar, Truck, ShieldCheck, ChevronDown, 
  CheckCircle2, Sparkles, Clock, AlertCircle, Info, ArrowRight,
  PackageCheck, Zap
} from 'lucide-react'
import { formatPrice } from '../lib/utils'

export default function InstallmentPlanView({ 
  price = 0, 
  defaultExpanded = false,
  selectedPlanType = 'complete', // 'complete' | 'installment'
  selectedMonths = 12,
  selectedFrequency = 'weekly', // 'weekly' | 'monthly'
  onPlanChange = null,
  showSelectButtons = false,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [activePlan, setActivePlan] = useState(selectedPlanType)
  const [frequency, setFrequency] = useState(selectedFrequency || 'weekly') // 'weekly' | 'monthly'
  const [monthlyTenure, setMonthlyTenure] = useState(selectedMonths || 12)
  const [weeklyTenure, setWeeklyTenure] = useState(4)
  const [showSchedule, setShowSchedule] = useState(false)

  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0
  const isWeekly = frequency === 'weekly'
  const currentCount = isWeekly ? weeklyTenure : monthlyTenure
  const installmentAmount = currentCount > 0 ? (numPrice / currentCount) : numPrice
  const minWeeklyAmount = numPrice / 24
  const minMonthlyAmount = numPrice / 12

  // Weekly installment options
  const WEEKLY_OPTIONS = [
    { count: 4, label: '4 Weeks', note: 'Pay in 4 (Popular)' },
    { count: 8, label: '8 Weeks', note: '2 Months' },
    { count: 12, label: '12 Weeks', note: '3 Months' },
    { count: 24, label: '24 Weeks', note: 'Lowest Weekly' },
  ]

  // Monthly installment options up to a year
  const MONTHLY_OPTIONS = [
    { count: 3, label: '3 Months', note: 'Fastest Payoff' },
    { count: 6, label: '6 Months', note: 'Popular' },
    { count: 9, label: '9 Months', note: 'Flexible' },
    { count: 12, label: '12 Months (1 Year)', note: 'Lowest Monthly' },
  ]

  const emitPlanChange = (plan, freq = frequency, count = (freq === 'weekly' ? weeklyTenure : monthlyTenure)) => {
    setActivePlan(plan)
    if (onPlanChange) {
      if (plan === 'complete') {
        onPlanChange({
          type: 'complete',
          frequency: 'complete',
          periodCount: 1,
          months: 1,
          weeks: 1,
          installmentAmount: numPrice,
          monthlyAmount: numPrice,
          weeklyAmount: numPrice,
          totalAmount: numPrice,
          downPayment: numPrice,
        })
      } else {
        const amt = count > 0 ? numPrice / count : numPrice
        onPlanChange({
          type: 'installment',
          frequency: freq,
          periodCount: count,
          months: freq === 'monthly' ? count : Math.ceil(count / 4),
          weeks: freq === 'weekly' ? count : count * 4,
          installmentAmount: amt,
          monthlyAmount: freq === 'monthly' ? amt : amt * 4,
          weeklyAmount: freq === 'weekly' ? amt : amt / 4,
          totalAmount: numPrice,
          downPayment: amt,
        })
      }
    }
  }

  const handleSelectPlanType = (plan) => {
    setActivePlan(plan)
    emitPlanChange(plan, frequency, frequency === 'weekly' ? weeklyTenure : monthlyTenure)
  }

  const handleFrequencyChange = (freq) => {
    setFrequency(freq)
    const count = freq === 'weekly' ? weeklyTenure : monthlyTenure
    emitPlanChange('installment', freq, count)
  }

  const handleTenureChange = (count) => {
    if (frequency === 'weekly') {
      setWeeklyTenure(count)
    } else {
      setMonthlyTenure(count)
    }
    emitPlanChange('installment', frequency, count)
  }

  // Generate payment schedule preview (weekly or monthly)
  const generateSchedule = () => {
    const schedule = []
    const today = new Date()
    const count = currentCount
    const amount = installmentAmount

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(today)
      if (isWeekly) {
        dueDate.setDate(today.getDate() + (i * 7))
      } else {
        dueDate.setMonth(today.getMonth() + i)
      }

      schedule.push({
        installmentNumber: i + 1,
        periodLabel: isWeekly ? `Week ${i + 1} of ${count}` : `Month ${i + 1} of ${count}`,
        dueDate: i === 0 ? 'Due Today (At Checkout)' : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: amount,
        status: i === 0 ? 'Initial Deposit' : (isWeekly ? 'Automated Weekly Billing' : 'Automated Monthly Billing'),
      })
    }
    return schedule
  }

  return (
    <div className={`rounded-2xl border border-veltrix-gray-800 bg-veltrix-black-light/90 shadow-xl overflow-hidden transition-all duration-300 ${className}`}>
      
      {/* ── Expandable Header Banner ── */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-veltrix-gray-900/40 transition-colors group"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-veltrix-blue/20 to-purple-500/20 border border-veltrix-blue/30 text-veltrix-blue flex items-center justify-center shrink-0 shadow-glow">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">
                Payment Plans & Installment Financing
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 uppercase tracking-wider">
                0% APR Promo
              </span>
            </div>
            <p className="text-xs text-veltrix-gray-400 mt-0.5">
              Pay complete & ship now, or spread weekly from <strong className="text-veltrix-blue font-bold">{formatPrice(minWeeklyAmount)}/wk</strong> or monthly from <strong className="text-purple-400 font-bold">{formatPrice(minMonthlyAmount)}/mo</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-2 shrink-0">
          <span className="hidden sm:inline-block text-xs font-semibold text-veltrix-blue group-hover:underline">
            {isExpanded ? 'Hide Options' : 'View Plans'}
          </span>
          <div className={`w-8 h-8 rounded-lg bg-veltrix-black flex items-center justify-center border border-veltrix-gray-800 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-veltrix-blue' : 'text-veltrix-gray-400'}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* ── Expanded Plan Set ── */}
      {isExpanded && (
        <div className="p-4 sm:p-6 border-t border-veltrix-gray-800 space-y-5 animate-fade-in bg-veltrix-black/40">
          
          <div className="text-xs text-veltrix-gray-400 leading-relaxed">
            Choose your preferred order settlement option below. Base pricing is calculated in <strong>US Dollars ($)</strong> with zero hidden processing charges.
          </div>

          {/* Plan Cards Grid: Plan A (Complete) vs Plan B (Installments) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* ── Plan A: Pay Complete & Ship Now ── */}
            <div
              onClick={() => handleSelectPlanType('complete')}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                activePlan === 'complete'
                  ? 'bg-gradient-to-br from-veltrix-blue/15 to-transparent border-veltrix-blue shadow-glow'
                  : 'bg-veltrix-black-light border-veltrix-gray-800/80 hover:border-veltrix-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    Ship Now
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    activePlan === 'complete'
                      ? 'border-veltrix-blue bg-veltrix-blue text-veltrix-black'
                      : 'border-veltrix-gray-600 bg-transparent'
                  }`}>
                    {activePlan === 'complete' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                <h3 className="font-black text-white text-base">Pay Complete & Ship Now</h3>
                <p className="text-xs text-veltrix-gray-400 mt-1">
                  100% upfront settlement with instantaneous courier dispatch within 24 hours.
                </p>

                <div className="mt-4 p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800/80">
                  <span className="text-[10px] text-veltrix-gray-500 uppercase tracking-wider font-semibold">Total Due Today</span>
                  <p className="text-2xl font-black text-white">{formatPrice(numPrice)}</p>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-veltrix-gray-300">
                  <li className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span>Dispatched immediately with priority tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                    <span>Full manufacturer warranty activated Day 1</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                    <span>Zero future debits or recurring balances</span>
                  </li>
                </ul>
              </div>

              {showSelectButtons && (
                <button
                  type="button"
                  onClick={() => handleSelectPlanType('complete')}
                  className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activePlan === 'complete'
                      ? 'bg-veltrix-blue text-veltrix-black shadow-glow'
                      : 'bg-veltrix-gray-800 text-white hover:bg-veltrix-gray-700'
                  }`}
                >
                  {activePlan === 'complete' ? '✓ Selected: Pay Complete' : 'Select Complete Payment'}
                </button>
              )}
            </div>

            {/* ── Plan B: Pay in Installments (Weekly or Monthly) ── */}
            <div
              onClick={() => handleSelectPlanType('installment')}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                activePlan === 'installment'
                  ? 'bg-gradient-to-br from-purple-500/15 via-veltrix-blue/10 to-transparent border-purple-400 shadow-glow'
                  : 'bg-veltrix-black-light border-veltrix-gray-800/80 hover:border-veltrix-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Installments (0% Interest)
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    activePlan === 'installment'
                      ? 'border-purple-400 bg-purple-400 text-black'
                      : 'border-veltrix-gray-600 bg-transparent'
                  }`}>
                    {activePlan === 'installment' && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                <h3 className="font-black text-white text-base">Pay in Installments</h3>
                <p className="text-xs text-veltrix-gray-400 mt-1">
                  Spread purchase payments comfortably in <strong>weekly</strong> or <strong>monthly</strong> installments with 0% interest.
                </p>

                {/* Frequency Switcher: Weekly vs Monthly */}
                <div className="mt-3.5 flex items-center gap-1 p-1 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFrequencyChange('weekly')
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isWeekly
                        ? 'bg-gradient-to-r from-purple-500 to-veltrix-blue text-white shadow-md'
                        : 'text-veltrix-gray-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Weekly Payments</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFrequencyChange('monthly')
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !isWeekly
                        ? 'bg-gradient-to-r from-purple-500 to-veltrix-blue text-white shadow-md'
                        : 'text-veltrix-gray-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Monthly Payments</span>
                  </button>
                </div>

                {/* Tenure Selector Pills (Weekly or Monthly) */}
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
                  {(isWeekly ? WEEKLY_OPTIONS : MONTHLY_OPTIONS).map((opt) => {
                    const isSelected = activePlan === 'installment' && currentCount === opt.count
                    return (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTenureChange(opt.count)
                        }}
                        className={`py-2 px-1 text-center rounded-lg transition-all ${
                          isSelected
                            ? 'bg-purple-500 text-white font-bold shadow-md'
                            : 'text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-900 text-xs font-semibold'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">{opt.label}</div>
                        <div className="text-[9px] opacity-75 font-normal truncate">{opt.note}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Calculated Installment Breakdown Box */}
                <div className="mt-3 p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-veltrix-gray-500 uppercase tracking-wider font-semibold">
                      {isWeekly ? `Weekly Payment (${weeklyTenure} Wks)` : `Monthly Payment (${monthlyTenure} Mos)`}
                    </span>
                    <p className="text-2xl font-black text-purple-300">
                      {formatPrice(installmentAmount)}
                      <span className="text-xs text-veltrix-gray-400 font-normal">
                        {isWeekly ? '/wk' : '/mo'}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-veltrix-gray-500 uppercase tracking-wider font-semibold">
                      1st Deposit Today
                    </span>
                    <p className="text-sm font-bold text-white">{formatPrice(installmentAmount)}</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-veltrix-gray-300">
                  <li className="flex items-center gap-2">
                    <PackageCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Gadget instantly allocated & secured in Austin Hub</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                    <span>
                      Transparent breakdown: {currentCount} equal {isWeekly ? 'weekly' : 'monthly'} installments of {formatPrice(installmentAmount)}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span>Pay off early at any time with zero penalties</span>
                  </li>
                </ul>
              </div>

              {showSelectButtons && (
                <button
                  type="button"
                  onClick={() => handleSelectPlanType('installment')}
                  className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activePlan === 'installment'
                      ? 'bg-purple-500 text-white shadow-glow'
                      : 'bg-veltrix-gray-800 text-white hover:bg-veltrix-gray-700'
                  }`}
                >
                  {activePlan === 'installment'
                    ? `✓ Selected: ${currentCount}-${isWeekly ? 'Week' : 'Month'} Plan (${formatPrice(installmentAmount)}/${isWeekly ? 'wk' : 'mo'})`
                    : `Select ${isWeekly ? 'Weekly' : 'Monthly'} Installment Plan`}
                </button>
              )}
            </div>

          </div>

          {/* ── Collapsible Full Payment Schedule ── */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center justify-between w-full p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 text-xs font-semibold text-veltrix-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-veltrix-blue" />
                View Full {currentCount}-{isWeekly ? 'Week' : 'Month'} Payment Schedule Breakdown ({formatPrice(installmentAmount)}/{isWeekly ? 'week' : 'month'})
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showSchedule ? 'rotate-180 text-veltrix-blue' : ''}`} />
            </button>

            {showSchedule && (
              <div className="mt-2 p-3 sm:p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800/80 animate-fade-in space-y-2">
                <div className="grid grid-cols-4 text-[10px] text-veltrix-gray-500 font-bold uppercase tracking-wider pb-1 border-b border-veltrix-gray-800">
                  <span>Installment</span>
                  <span>Estimated Date</span>
                  <span className="text-right">Amount ($)</span>
                  <span className="text-right">Settlement</span>
                </div>
                {generateSchedule().map((row) => (
                  <div key={row.installmentNumber} className="grid grid-cols-4 text-xs py-1.5 border-b border-veltrix-gray-900 last:border-0 items-center">
                    <span className="font-semibold text-white">{row.periodLabel}</span>
                    <span className="text-veltrix-gray-400 font-mono text-[11px]">{row.dueDate}</span>
                    <span className="text-right font-bold text-white font-mono">{formatPrice(row.amount)}</span>
                    <span className="text-right text-[10px]">
                      {row.installmentNumber === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">Due Today</span>
                      ) : (
                        <span className="text-veltrix-gray-400">Scheduled</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notice & Terms Footer */}
          <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 flex items-start gap-2.5 text-[11px] text-veltrix-gray-400">
            <Info className="w-4 h-4 text-veltrix-blue shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Order Fulfillment Notice:</strong> Selecting <em>Pay Complete & Ship Now</em> qualifies for immediate 24–48h express courier tracking from our central warehouse (2349 Brentwood Drive, Austin, TX 78749). Installment plans allow convenient weekly or month-by-month budgeting up to a year.
            </p>
          </div>

        </div>
      )}

    </div>
  )
}
