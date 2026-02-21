# Sector WACC Adjustments — Nigerian Stock Exchange (NGX)

Use these typical WACC ranges as starting points, then adjust based on company-specific factors.

**Base assumption:** Risk-free rate = 18-19% (FGN 10-year bond yield), Equity risk premium = 5-7%.

## Determining Company Sector

Use `ngx_search` with query `"[TICKER] company facts"` to retrieve the company's `sector`. Match the returned sector to the table below.

## WACC by NGX Sector

| Sector | Typical WACC Range | Notes |
|--------|-------------------|-------|
| Banking | 22-26% | Leverage inherent in business model; well-regulated |
| Oil & Gas | 26-32% | Commodity + FX exposure; high capex requirements |
| Consumer Goods | 23-27% | Relatively stable demand; input cost inflation risk |
| Industrial Goods | 24-28% | Cyclical; large capex; infrastructure dependency |
| Insurance | 23-27% | Regulatory capital requirements; investment income volatility |
| Agriculture | 25-30% | Weather/seasonal risk; supply chain fragility |
| Healthcare | 24-28% | Regulatory risk; FX exposure on imports |
| ICT / Telecoms | 23-27% | Stable cash flows; significant capex; regulatory fees |
| Services | 24-28% | Diverse risk profiles; moderate cyclicality |
| Conglomerates | 24-28% | Diversified but complex; holding company discount |

## Adjustment Factors

Add to base WACC:
- **High debt (D/E > 1.5)**: +1-2%
- **Small cap (< ₦50B market cap)**: +2-4%
- **High FX exposure (imports/exports)**: +1-3%
- **Concentrated customer base**: +0.5-1%
- **Regulatory uncertainty**: +0.5-1.5%
- **Low free float (< 20%)**: +1-2% (liquidity premium)

Subtract from base WACC:
- **Market leader with moat**: -0.5-1%
- **Recurring revenue model**: -0.5-1%
- **Strong Tier-1 banking relationship**: -0.5%
- **Consistent dividend payer (5+ years)**: -0.5-1%

## Reasonableness Checks

- WACC should typically be 2-4% below ROIC for value-creating companies
- If calculated WACC > ROIC, the company may be destroying value
- Nigerian WACC will be significantly higher than US/EU due to high risk-free rate
- Compare to sector peers listed on NGX if available
