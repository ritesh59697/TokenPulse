# TokenPulse

tokenpulse is a premium, high-fidelity web3 market intelligence dashboard that streams live cryptocurrency valuations, commodity spot prices, and houses an interactive simulated portfolio tracker. designed with glassmorphic aesthetics, micro-animations, and custom ambient glowing themes.

---

## key features

### 1. market overview & live prices
* dynamic coin feeds: displays market metrics (price, market cap, 24h volume) powered by the coingecko api.
* live websockets: integrates real-time price feeds streaming directly from binance websockets for instant tick-by-tick updates.

### 2. simulated portfolio tracker
* asset simulator: add mock purchase quantities and target buy prices to simulate entry levels.
* live valuations: aggregates holdings in real-time, displaying aggregated cost-basis, live net worth, and total green/red profit margins.
* holdings distribution: renders a gorgeous horizontal progress bar illustrating your asset allocation percentages (e.g., btc, eth, sol).
* local persistence: saves all transaction histories directly to localstorage so your dashboard state is preserved on refresh.

### 3. resilient commodities panel
* spot prices: tracks gold (xau), silver (xag), crude oil (wti), natural gas, and copper benchmark rates.
* zero-downtime fallback: employs an organic random-walk simulation engine if alpha vantage rate limits are exceeded, keeping your visual dashboard 100% active and running.
* sequential bypass: automatically speeds up loading times by skipping the 14-second api rate limit staggers if any rate limits or fallbacks are detected.

---

## getting started

### prerequisites
* node.js (v16+ recommended)
* npm or yarn

### installation
1. clone the repository:
   ```bash
   git clone <your-repository-url>
   cd tokenpulse
   ```

2. install dependencies:
   ```bash
   npm install
   ```

3. duplicate the environment variables template:
   ```bash
   cp .env.example .env
   ```

4. configure your .env file (see environment setup below).

5. spin up the local development server:
   ```bash
   npm start
   ```
   open your browser to http://localhost:3000 to view the live dashboard!

---

## environment setup

TokenPulse uses environment variables to securely load external api keys. make sure your .env file (which is automatically ignored by git) contains the following parameters:

```env
# coingecko api key (demonstration fallback provided)
react_app_coingecko_key=your_coingecko_api_key

# alpha vantage api key (fallbacks to organic simulator if left empty)
react_app_alphavantage_key=your_alphavantage_api_key
```

---

## license
this project is open-source and available under the mit license.
