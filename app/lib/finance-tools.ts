export type FinanceField = {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  step?: number;
};

export type FinanceDefinition = {
  fields: FinanceField[];
  note?: string;
  calculate: (values: Record<string, number>) => string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
const percent = (value: number) => `${value.toFixed(2)}%`;
const requirePositive = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be greater than zero.`);
};
const emi = (principal: number, annualRate: number, years: number) => {
  requirePositive(principal, "Loan amount");
  requirePositive(years, "Loan term");
  const months = years * 12;
  const rate = annualRate / 1200;
  return rate === 0
    ? principal / months
    : (principal * rate * (1 + rate) ** months) / ((1 + rate) ** months - 1);
};
const loanOutput = (principal: number, annualRate: number, years: number) => {
  const payment = emi(principal, annualRate, years);
  const total = payment * years * 12;
  return `Monthly payment: ${money(payment)}\nTotal payment: ${money(total)}\nTotal interest: ${money(total - principal)}`;
};

const f = (
  key: string,
  label: string,
  defaultValue: number,
  min = 0,
  step = 0.01,
): FinanceField => ({ key, label, defaultValue, min, step });

export const financeDefinitions: Record<string, FinanceDefinition> = {
  "currency-converter": {
    fields: [
      f("amount", "Amount", 100),
      f("rate", "Exchange rate (target units per 1 source unit)", 1),
    ],
    note: "Enter the current exchange rate from your preferred market-data source.",
    calculate: ({ amount, rate }) => {
      requirePositive(rate, "Exchange rate");
      return `Converted amount: ${money(amount * rate)}`;
    },
  },
  "emergency-fund-calculator": {
    fields: [
      f("expenses", "Essential monthly expenses", 30000),
      f("months", "Months of coverage", 6, 1, 1),
      f("saved", "Current emergency savings", 0),
    ],
    calculate: ({ expenses, months, saved }) =>
      `Target fund: ${money(expenses * months)}\nAdditional savings needed: ${money(Math.max(0, expenses * months - saved))}\nCoverage from current savings: ${expenses ? (saved / expenses).toFixed(1) : "0"} months`,
  },
  "compound-interest-calculator": {
    fields: [
      f("principal", "Initial principal", 100000),
      f("rate", "Annual interest rate (%)", 8),
      f("years", "Years", 10, 0.01),
      f("frequency", "Compounds per year", 12, 1, 1),
    ],
    calculate: ({ principal, rate, years, frequency }) => {
      requirePositive(frequency, "Compounding frequency");
      const total =
        principal * (1 + rate / 100 / frequency) ** (frequency * years);
      return `Future value: ${money(total)}\nInterest earned: ${money(total - principal)}`;
    },
  },
  "tax-calculator": {
    fields: [
      f("income", "Gross income", 600000),
      f("deductions", "Eligible deductions", 0),
      f("rate", "Effective tax rate (%)", 10),
    ],
    note: "This estimates tax using the effective rate you enter; it is not a jurisdiction-specific tax return.",
    calculate: ({ income, deductions, rate }) => {
      const taxable = Math.max(0, income - deductions);
      const tax = (taxable * rate) / 100;
      return `Taxable income: ${money(taxable)}\nEstimated tax: ${money(tax)}\nAfter-tax income: ${money(income - tax)}`;
    },
  },
  "personal-loan-calculator": {
    fields: [
      f("principal", "Loan amount", 500000),
      f("rate", "Annual interest rate (%)", 12),
      f("years", "Loan term (years)", 5, 0.01),
    ],
    calculate: ({ principal, rate, years }) =>
      loanOutput(principal, rate, years),
  },
  "education-loan-calculator": {
    fields: [
      f("principal", "Education loan amount", 1000000),
      f("rate", "Annual interest rate (%)", 9),
      f("years", "Repayment term (years)", 10, 0.01),
    ],
    calculate: ({ principal, rate, years }) =>
      loanOutput(principal, rate, years),
  },
  "gold-loan-calculator": {
    fields: [
      f("principal", "Gold loan amount", 200000),
      f("rate", "Annual interest rate (%)", 10),
      f("years", "Loan term (years)", 1, 0.01),
    ],
    calculate: ({ principal, rate, years }) =>
      loanOutput(principal, rate, years),
  },
  "cagr-calculator": {
    fields: [
      f("beginning", "Beginning value", 100000),
      f("ending", "Ending value", 200000),
      f("years", "Number of years", 5, 0.01),
    ],
    calculate: ({ beginning, ending, years }) => {
      requirePositive(beginning, "Beginning value");
      requirePositive(ending, "Ending value");
      requirePositive(years, "Years");
      return `CAGR: ${percent(((ending / beginning) ** (1 / years) - 1) * 100)}\nAbsolute growth: ${percent(((ending - beginning) / beginning) * 100)}`;
    },
  },
  "home-loan-eligibility-calculator": {
    fields: [
      f("income", "Monthly net income", 100000),
      f("obligations", "Existing monthly obligations", 10000),
      f("rate", "Annual loan rate (%)", 8.5),
      f("years", "Loan term (years)", 20, 1),
    ],
    note: "Estimate assumes up to 50% of net income may service all monthly debt.",
    calculate: ({ income, obligations, rate, years }) => {
      const affordable = Math.max(0, income * 0.5 - obligations);
      const r = rate / 1200;
      const n = years * 12;
      const eligible =
        r === 0
          ? affordable * n
          : (affordable * ((1 + r) ** n - 1)) / (r * (1 + r) ** n);
      return `Affordable monthly payment: ${money(affordable)}\nEstimated eligible loan: ${money(eligible)}`;
    },
  },
  "inflation-calculator": {
    fields: [
      f("amount", "Current amount", 100000),
      f("rate", "Annual inflation rate (%)", 6),
      f("years", "Years", 10, 0.01),
    ],
    calculate: ({ amount, rate, years }) => {
      const future = amount * (1 + rate / 100) ** years;
      return `Equivalent future cost: ${money(future)}\nIncrease due to inflation: ${money(future - amount)}\nFuture purchasing power of current amount: ${money(amount / (1 + rate / 100) ** years)}`;
    },
  },
  "simple-interest-calculator": {
    fields: [
      f("principal", "Principal", 100000),
      f("rate", "Annual interest rate (%)", 8),
      f("years", "Time (years)", 5, 0.01),
    ],
    calculate: ({ principal, rate, years }) => {
      const interest = (principal * rate * years) / 100;
      return `Simple interest: ${money(interest)}\nTotal amount: ${money(principal + interest)}`;
    },
  },
  "position-size-calculator": {
    fields: [
      f("capital", "Account balance", 100000),
      f("risk", "Risk per trade (%)", 1),
      f("entry", "Entry price", 100),
      f("stop", "Stop-loss price", 95),
    ],
    calculate: ({ capital, risk, entry, stop }) => {
      const distance = Math.abs(entry - stop);
      requirePositive(distance, "Entry-to-stop distance");
      const riskAmount = (capital * risk) / 100;
      return `Risk amount: ${money(riskAmount)}\nPosition size: ${(riskAmount / distance).toFixed(4)} units\nPosition value: ${money((riskAmount / distance) * entry)}`;
    },
  },
  "apy-calculator": {
    fields: [
      f("rate", "Nominal annual rate (%)", 8),
      f("frequency", "Compounds per year", 12, 1, 1),
    ],
    calculate: ({ rate, frequency }) => {
      requirePositive(frequency, "Compounds per year");
      return `APY: ${percent(((1 + rate / 100 / frequency) ** frequency - 1) * 100)}`;
    },
  },
  "lot-size-calculator": {
    fields: [
      f("balance", "Account balance", 10000),
      f("risk", "Risk per trade (%)", 1),
      f("stopPips", "Stop loss (pips)", 20),
      f("pipValue", "Pip value per standard lot", 10),
    ],
    calculate: ({ balance, risk, stopPips, pipValue }) => {
      requirePositive(stopPips, "Stop loss");
      requirePositive(pipValue, "Pip value");
      const riskAmount = (balance * risk) / 100;
      return `Risk amount: ${money(riskAmount)}\nPosition size: ${(riskAmount / (stopPips * pipValue)).toFixed(4)} standard lots`;
    },
  },
  "roi-calculator": {
    fields: [
      f("invested", "Amount invested", 100000),
      f("returned", "Final value / proceeds", 125000),
    ],
    calculate: ({ invested, returned }) => {
      requirePositive(invested, "Amount invested");
      return `Net return: ${money(returned - invested)}\nROI: ${percent(((returned - invested) / invested) * 100)}`;
    },
  },
  "bonus-calculator": {
    fields: [
      f("salary", "Base salary", 600000),
      f("rate", "Bonus rate (%)", 10),
    ],
    calculate: ({ salary, rate }) =>
      `Bonus: ${money((salary * rate) / 100)}\nTotal compensation: ${money(salary * (1 + rate / 100))}`,
  },
  "future-value-calculator": {
    fields: [
      f("present", "Present value", 100000),
      f("rate", "Annual return (%)", 8),
      f("years", "Years", 10, 0.01),
      f("contribution", "Annual contribution (end of year)", 0),
    ],
    calculate: ({ present, rate, years, contribution }) => {
      const r = rate / 100;
      const factor = (1 + r) ** years;
      const total =
        present * factor +
        (r === 0 ? contribution * years : (contribution * (factor - 1)) / r);
      return `Future value: ${money(total)}\nTotal contributions: ${money(present + contribution * years)}\nEstimated growth: ${money(total - present - contribution * years)}`;
    },
  },
  "net-worth-calculator": {
    fields: [
      f("assets", "Total assets", 5000000),
      f("liabilities", "Total liabilities", 1500000),
    ],
    calculate: ({ assets, liabilities }) =>
      `Net worth: ${money(assets - liabilities)}\nAssets: ${money(assets)}\nLiabilities: ${money(liabilities)}`,
  },
  "pip-calculator": {
    fields: [
      f("units", "Position size (currency units)", 100000),
      f("pipSize", "Pip size", 0.0001, 0.000001, 0.0001),
      f("conversionRate", "Quote-to-account currency rate", 1),
    ],
    calculate: ({ units, pipSize, conversionRate }) => {
      requirePositive(conversionRate, "Conversion rate");
      return `Pip value: ${money((units * pipSize) / conversionRate)} per pip`;
    },
  },
  "fire-calculator": {
    fields: [
      f("expenses", "Annual expenses", 600000),
      f("withdrawal", "Safe withdrawal rate (%)", 4),
      f("invested", "Current invested assets", 2000000),
    ],
    calculate: ({ expenses, withdrawal, invested }) => {
      requirePositive(withdrawal, "Withdrawal rate");
      const target = expenses / (withdrawal / 100);
      return `FIRE target: ${money(target)}\nCurrent progress: ${percent(target ? (invested / target) * 100 : 0)}\nRemaining amount: ${money(Math.max(0, target - invested))}`;
    },
  },
  "present-value-calculator": {
    fields: [
      f("future", "Future value", 200000),
      f("rate", "Annual discount rate (%)", 8),
      f("years", "Years", 10, 0.01),
    ],
    calculate: ({ future, rate, years }) =>
      `Present value: ${money(future / (1 + rate / 100) ** years)}`,
  },
  "apr-calculator": {
    fields: [
      f("principal", "Loan amount", 500000),
      f("interest", "Total interest over loan", 150000),
      f("fees", "Total loan fees", 5000),
      f("years", "Loan term (years)", 5, 0.01),
    ],
    note: "This is a simple annualized cost estimate, not the actuarial APR required by every jurisdiction.",
    calculate: ({ principal, interest, fees, years }) => {
      requirePositive(principal, "Loan amount");
      requirePositive(years, "Loan term");
      return `Estimated APR: ${percent(((interest + fees) / principal / years) * 100)}\nTotal borrowing cost: ${money(interest + fees)}`;
    },
  },
  "loan-interest-rate-calculator": {
    fields: [
      f("principal", "Loan amount", 500000),
      f("payment", "Monthly payment", 11122),
      f("months", "Number of monthly payments", 60, 1, 1),
    ],
    calculate: ({ principal, payment, months }) => {
      requirePositive(principal, "Loan amount");
      requirePositive(payment, "Monthly payment");
      requirePositive(months, "Number of payments");
      if (payment * months < principal)
        throw new Error("Payment is too low to repay this loan.");
      let low = 0,
        high = 1;
      for (let i = 0; i < 100; i++) {
        const r = (low + high) / 2;
        const estimated =
          r === 0
            ? principal / months
            : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
        if (estimated > payment) high = r;
        else low = r;
      }
      return `Estimated annual interest rate: ${percent(((low + high) / 2) * 1200)}\nTotal payment: ${money(payment * months)}\nTotal interest: ${money(payment * months - principal)}`;
    },
  },
  "monthly-salary-calculator": {
    fields: [
      f("annual", "Annual base salary", 600000),
      f("bonus", "Annual bonus", 0),
      f("deductions", "Estimated deductions (%)", 10),
    ],
    calculate: ({ annual, bonus, deductions }) => {
      const gross = (annual + bonus) / 12;
      return `Gross monthly salary: ${money(gross)}\nEstimated monthly deductions: ${money((gross * deductions) / 100)}\nEstimated net monthly salary: ${money(gross * (1 - deductions / 100))}`;
    },
  },
  "property-tax-calculator": {
    fields: [
      f("value", "Assessed property value", 5000000),
      f("rate", "Annual property tax rate (%)", 1),
    ],
    calculate: ({ value, rate }) =>
      `Annual property tax: ${money((value * rate) / 100)}\nMonthly equivalent: ${money((value * rate) / 1200)}`,
  },
  "profit-margin-calculator": {
    fields: [
      f("revenue", "Revenue / selling price", 1000),
      f("cost", "Total cost", 700),
    ],
    calculate: ({ revenue, cost }) => {
      requirePositive(revenue, "Revenue");
      return `Gross profit: ${money(revenue - cost)}\nProfit margin: ${percent(((revenue - cost) / revenue) * 100)}\nMarkup: ${cost ? percent(((revenue - cost) / cost) * 100) : "Not defined"}`;
    },
  },
  "crypto-profit-calculator": {
    fields: [
      f("buy", "Buy price per coin", 100),
      f("sell", "Sell/current price per coin", 150),
      f("quantity", "Quantity", 10),
      f("fees", "Total fees", 0),
    ],
    calculate: ({ buy, sell, quantity, fees }) => {
      const cost = buy * quantity + fees;
      const proceeds = sell * quantity;
      const profit = proceeds - cost;
      return `Net profit/loss: ${money(profit)}\nReturn: ${cost ? percent((profit / cost) * 100) : "Not defined"}\nFinal proceeds: ${money(proceeds)}`;
    },
  },
  "loan-term-calculator": {
    fields: [
      f("principal", "Loan amount", 500000),
      f("payment", "Monthly payment", 12000),
      f("rate", "Annual interest rate (%)", 10),
    ],
    calculate: ({ principal, payment, rate }) => {
      requirePositive(principal, "Loan amount");
      requirePositive(payment, "Monthly payment");
      const r = rate / 1200;
      if (r > 0 && payment <= principal * r)
        throw new Error("Payment must exceed the monthly interest.");
      const months =
        r === 0
          ? principal / payment
          : -Math.log(1 - (principal * r) / payment) / Math.log(1 + r);
      return `Estimated term: ${Math.ceil(months)} months\nApproximately: ${(months / 12).toFixed(2)} years\nEstimated total interest: ${money(payment * Math.ceil(months) - principal)}`;
    },
  },
  "margin-calculator-forex": {
    fields: [
      f("size", "Position size (base units)", 100000),
      f("price", "Market price", 1),
      f("leverage", "Leverage (e.g. 100 for 1:100)", 100, 1, 1),
    ],
    calculate: ({ size, price, leverage }) => {
      requirePositive(leverage, "Leverage");
      return `Required margin: ${money((size * price) / leverage)}\nPosition value: ${money(size * price)}\nMargin rate: ${percent(100 / leverage)}`;
    },
  },
  "rental-yield-calculator": {
    fields: [
      f("price", "Property purchase price", 5000000),
      f("rent", "Monthly rent", 30000),
      f("expenses", "Annual expenses", 50000),
      f("vacancy", "Expected vacancy (%)", 5),
    ],
    calculate: ({ price, rent, expenses, vacancy }) => {
      requirePositive(price, "Property price");
      const gross = rent * 12;
      const net = gross * (1 - vacancy / 100) - expenses;
      return `Gross annual rent: ${money(gross)}\nNet annual income: ${money(net)}\nGross rental yield: ${percent((gross / price) * 100)}\nNet rental yield: ${percent((net / price) * 100)}`;
    },
  },
  "youtube-revenue-calculator": {
    fields: [
      f("views", "Daily video views", 10000, 1, 100),
      f("cpm", "Estimated CPM ($ per 1,000 views)", 4.5, 0.1, 0.1),
      f("share", "Creator revenue share (%)", 55, 1, 1),
    ],
    note: "CPM varies based on niche, viewer location, and seasonality.",
    calculate: ({ views, cpm, share }) => {
      const grossDaily = (views / 1000) * cpm;
      const netDaily = grossDaily * (share / 100);
      const netMonthly = netDaily * 30;
      const netAnnual = netDaily * 365;
      return `Daily Estimated Earnings: $${money(netDaily)}\nMonthly Estimated Earnings: $${money(netMonthly)}\nAnnual Estimated Earnings: $${money(netAnnual)}\n(Gross Ad Spend: $${money(grossDaily * 30)} / month)`;
    },
  },
  "instagram-engagement-calculator": {
    fields: [
      f("followers", "Followers count", 25000, 1, 1),
      f("likes", "Average likes per post", 1200, 0, 1),
      f("comments", "Average comments per post", 80, 0, 1),
    ],
    calculate: ({ followers, likes, comments }) => {
      requirePositive(followers, "Followers count");
      const interactions = likes + comments;
      const rate = (interactions / followers) * 100;
      let rating = "Good";
      if (rate >= 6) rating = "Viral / Phenomenal";
      else if (rate >= 3.5) rating = "High Engagement";
      else if (rate >= 1.5) rating = "Average Engagement";
      else rating = "Needs Improvement";

      return `Engagement Rate: ${rate.toFixed(2)}%\nPerformance Rating: ${rating}\nAverage Interactions per Post: ${money(interactions)} (${likes} likes, ${comments} comments)`;
    },
  },
  "commission-calculator": {
    fields: [
      f("sales", "Total sales volume ($)", 50000),
      f("rate", "Commission rate (%)", 8),
    ],
    calculate: ({ sales, rate }) => {
      const commission = (sales * rate) / 100;
      const remaining = sales - commission;
      return `Commission Earned: $${money(commission)}\nNet Sales Value: $${money(remaining)}`;
    },
  },
  "revenue-calculator": {
    fields: [
      f("units", "Units sold", 500, 1, 1),
      f("price", "Price per unit ($)", 49.99),
      f("discount", "Discount rate (%)", 5),
    ],
    calculate: ({ units, price, discount }) => {
      const gross = units * price;
      const discountAmt = (gross * discount) / 100;
      const net = gross - discountAmt;
      return `Gross Revenue: $${money(gross)}\nDiscount Savings Offered: -$${money(discountAmt)}\nNet Revenue Generated: $${money(net)}`;
    },
  },
};

export function calculateFinance(slug: string, values: Record<string, number>) {
  const definition = financeDefinitions[slug];
  if (!definition)
    throw new Error("This finance calculator is not configured.");
  for (const field of definition.fields)
    if (!Number.isFinite(values[field.key]))
      throw new Error(`${field.label} must be a valid number.`);
  return definition.calculate(values);
}
