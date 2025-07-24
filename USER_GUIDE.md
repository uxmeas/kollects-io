# 🚀 **kollects.io User Guide: Complete Platform Walkthrough**

## 📋 **Table of Contents**
1. [Getting Started](#getting-started)
2. [Real-time Portfolio Dashboard](#real-time-portfolio-dashboard)
3. [Performance Monitoring Dashboard](#performance-monitoring-dashboard)
4. [Price Alerts Dashboard](#price-alerts-dashboard)
5. [Market Sentiment Dashboard](#market-sentiment-dashboard)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 **Getting Started**

### **Step 1: Access the Platform**
Open your web browser and navigate to:
```
http://localhost:3000
```

### **Step 2: Choose Your Dashboard**
kollects.io offers 4 specialized dashboards, each designed for different use cases:

| Dashboard | URL | Purpose | Best For |
|-----------|-----|---------|----------|
| **Real-time Portfolio** | `/test-realtime` | Live portfolio monitoring | Active traders, real-time tracking |
| **Performance Monitoring** | `/phase2-dashboard` | System health & performance | Technical monitoring, debugging |
| **Price Alerts** | `/price-alerts-dashboard` | Price monitoring & alerts | Investors, automated notifications |
| **Market Sentiment** | `/market-sentiment-dashboard` | AI-powered market analysis | Research, trend analysis |

---

## 📊 **Real-time Portfolio Dashboard** (`/test-realtime`)

### **What It Does:**
Live monitoring of your NBA Top Shot and NFL All Day portfolio with real-time updates.

### **How to Use:**

#### **Step 1: Connect Your Wallet**
1. Navigate to `http://localhost:3000/test-realtime`
2. You'll see the connection status at the top
3. The system automatically connects to the WebSocket server
4. Status will show: "🟢 Connected" when successful

#### **Step 2: Enter Wallet Address**
1. In the "Wallet Address" field, enter your Flow wallet address
2. Example: `0x40f69697c82b7077`
3. Click "Connect" or press Enter
4. The system will fetch your portfolio data from the blockchain

#### **Step 3: Monitor Your Portfolio**
Once connected, you'll see:

**📈 Real-time Data:**
- **Last Update**: Shows when data was last refreshed
- **Connection Status**: WebSocket connection health
- **Portfolio Summary**: Total moments, collections

**🏀 NBA Top Shot Collection:**
- Moment IDs and details
- Real-time price updates
- Collection statistics

**🏈 NFL All Day Collection:**
- Moment IDs and details
- Real-time price updates
- Collection statistics

#### **Step 4: Real-time Updates**
- Data automatically refreshes every 30 seconds
- WebSocket connection provides instant updates
- No need to manually refresh the page

### **Example User Flow:**
```
1. Open /test-realtime
2. Enter wallet: 0x40f69697c82b7077
3. See portfolio load with real-time data
4. Monitor price changes and updates
5. Track collection performance over time
```

---

## ⚡ **Performance Monitoring Dashboard** (`/phase2-dashboard`)

### **What It Does:**
Monitors system health, performance metrics, and technical status in real-time.

### **How to Use:**

#### **Step 1: Access the Dashboard**
1. Navigate to `http://localhost:3000/phase2-dashboard`
2. Dashboard loads automatically with system metrics

#### **Step 2: Monitor System Health**
The dashboard shows several key sections:

**🔧 Circuit Breakers:**
- **Flow API**: Blockchain connection health
- **Cache**: Redis/in-memory cache status
- **WebSocket**: Real-time connection status
- **Status**: CLOSED (healthy) or OPEN (issues)

**📊 Smart Polling:**
- **Active Wallets**: Number of wallets being monitored
- **Error Counts**: Any polling errors by wallet
- **Refresh Rates**: Current polling intervals

**💾 Cache Performance:**
- **Cache Type**: Redis or In-Memory
- **Total Keys**: Number of cached items
- **Hit Rate**: Cache efficiency percentage

**🏥 Service Health:**
- **Flow Blockchain**: Connection status
- **WebSocket Server**: Real-time server status
- **Response Time**: API performance metrics

#### **Step 3: Real-time Monitoring**
- Dashboard auto-refreshes every 5 seconds
- All metrics update in real-time
- Green indicators = healthy, Red = issues

### **Example User Flow:**
```
1. Open /phase2-dashboard
2. Check all services are "healthy" (green)
3. Monitor response times (should be <500ms)
4. Watch for any circuit breaker issues
5. Verify cache performance
```

---

## 🔔 **Price Alerts Dashboard** (`/price-alerts-dashboard`)

### **What It Does:**
Create, manage, and monitor price alerts for your NFT moments with real-time notifications.

### **How to Use:**

#### **Step 1: Access the Dashboard**
1. Navigate to `http://localhost:3000/price-alerts-dashboard`
2. Dashboard loads with current alerts and statistics

#### **Step 2: Create a Price Alert**
1. **Fill out the Alert Form:**
   - **Moment ID**: Enter the NFT moment ID (e.g., `123456`)
   - **Alert Type**: Choose from:
     - `price_change`: Price changes by percentage
     - `price_above`: Price goes above threshold
     - `price_below`: Price goes below threshold
   - **Threshold**: Set the price or percentage value
   - **Description**: Add a note (optional)

2. **Example Alert Creation:**
   ```
   Moment ID: 123456
   Alert Type: price_above
   Threshold: 100
   Description: "Sell when price hits $100"
   ```

3. **Click "Create Alert"**
4. Alert appears in the "Active Alerts" list

#### **Step 3: Manage Your Alerts**
**Active Alerts List Shows:**
- **Moment ID**: Which NFT is being monitored
- **Alert Type**: Type of alert (change/above/below)
- **Threshold**: Your set price/percentage
- **Status**: Active/Paused
- **Created**: When alert was created
- **Actions**: Pause/Resume/Delete buttons

**Alert Management:**
- **Pause Alert**: Temporarily stop monitoring
- **Resume Alert**: Restart monitoring
- **Delete Alert**: Remove alert permanently

#### **Step 4: Monitor Notifications**
**Notification History Shows:**
- **Triggered Alerts**: When conditions were met
- **Moment ID**: Which NFT triggered
- **Old Price**: Previous price
- **New Price**: Current price
- **Timestamp**: When alert triggered

#### **Step 5: Trading Recommendations**
The system provides AI-powered recommendations:
- **Buy**: When sentiment is positive and price is low
- **Sell**: When sentiment is negative or price is high
- **Hold**: When conditions are neutral

### **Example User Flow:**
```
1. Open /price-alerts-dashboard
2. Create alert: Moment 123456, price_above $100
3. See alert in "Active Alerts" list
4. Monitor "Notification History" for triggers
5. Check "Trading Recommendations" for advice
6. Pause/delete alerts as needed
```

---

## 🧠 **Market Sentiment Dashboard** (`/market-sentiment-dashboard`)

### **What It Does:**
AI-powered market analysis using social media sentiment, trading volume, and ML predictions.

### **How to Use:**

#### **Step 1: Access the Dashboard**
1. Navigate to `http://localhost:3000/market-sentiment-dashboard`
2. Dashboard loads with market overview and analysis options

#### **Step 2: Start Sentiment Analysis**
1. **Select a Moment:**
   - Enter a Moment ID in the "Moment ID" field
   - Example: `123456`

2. **Click "Start Analysis"**
   - System begins collecting social media data
   - Analysis includes Twitter, Reddit, Discord
   - Trading volume analysis starts
   - ML predictions are generated

3. **Monitor Analysis Progress:**
   - Status shows "Active" when running
   - Real-time updates every 30 seconds

#### **Step 3: View Market Overview**
**Market Statistics:**
- **Total Moments**: Number of moments being analyzed
- **Positive Sentiment**: Percentage of positive sentiment
- **Neutral Sentiment**: Percentage of neutral sentiment
- **Negative Sentiment**: Percentage of negative sentiment

#### **Step 4: Detailed Analysis**
**For Each Analyzed Moment:**
- **Sentiment Breakdown:**
  - Twitter sentiment score
  - Reddit sentiment score
  - Discord sentiment score
  - Overall sentiment score

- **Volume Analysis:**
  - Trading volume trends
  - Volume spikes
  - Market activity patterns

- **Trend Predictions:**
  - ML-based price predictions
  - Confidence levels
  - Trend direction (up/down/stable)

- **Trading Recommendations:**
  - Buy/Sell/Hold advice
  - Confidence percentage
  - Reasoning for recommendation

#### **Step 5: Stop Analysis**
- Click "Stop Analysis" to halt monitoring
- Analysis data is preserved
- Can restart analysis anytime

### **Example User Flow:**
```
1. Open /market-sentiment-dashboard
2. Enter Moment ID: 123456
3. Click "Start Analysis"
4. Watch sentiment scores update in real-time
5. Check volume analysis and trend predictions
6. Review trading recommendations
7. Stop analysis when done
```

---

## 🚀 **Advanced Features**

### **Real-time WebSocket Integration**
- **Automatic Reconnection**: If connection drops, automatically reconnects
- **Live Updates**: No page refresh needed
- **Connection Status**: Always visible connection health

### **Smart Polling**
- **Dynamic Refresh**: System adjusts update frequency based on activity
- **Error Handling**: Automatic retry with exponential backoff
- **Resource Optimization**: Efficient use of system resources

### **Circuit Breaker Protection**
- **Automatic Recovery**: System self-heals from failures
- **Graceful Degradation**: Fallback options when services fail
- **Performance Monitoring**: Real-time failure detection

### **AI-Powered Insights**
- **Sentiment Analysis**: Social media sentiment scoring
- **Volume Analysis**: Trading pattern recognition
- **Predictive Modeling**: ML-based price predictions
- **Trading Recommendations**: Actionable investment advice

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **WebSocket Connection Issues**
**Problem**: Connection status shows "🔴 Disconnected"
**Solutions**:
1. Refresh the page
2. Check internet connection
3. Wait for automatic reconnection
4. Clear browser cache

#### **Slow Response Times**
**Problem**: Response times >500ms
**Solutions**:
1. Check system health dashboard
2. Verify all services are healthy
3. Wait for circuit breakers to reset
4. Check network connection

#### **Alert Not Triggering**
**Problem**: Price alerts not firing
**Solutions**:
1. Verify alert is "Active" status
2. Check threshold values are correct
3. Ensure moment ID is valid
4. Monitor notification history

#### **Sentiment Analysis Not Working**
**Problem**: Sentiment scores not updating
**Solutions**:
1. Verify analysis is "Active"
2. Check moment ID is valid
3. Wait for data collection (may take 30-60 seconds)
4. Restart analysis if needed

### **Performance Tips**
1. **Use Real-time Dashboard** for active trading
2. **Monitor Performance Dashboard** for system health
3. **Set Price Alerts** for automated monitoring
4. **Use Sentiment Analysis** for research and planning
5. **Keep dashboards open** for continuous monitoring

---

## 📱 **Mobile Usage**

### **Responsive Design**
All dashboards work on mobile devices:
- **Touch-friendly**: All buttons and controls optimized for touch
- **Responsive layout**: Automatically adjusts to screen size
- **Mobile-optimized**: Fast loading on mobile networks

### **Mobile Best Practices**
1. **Use landscape mode** for better dashboard visibility
2. **Keep screen on** for continuous monitoring
3. **Use WiFi** for better WebSocket performance
4. **Bookmark dashboards** for quick access

---

## 🎯 **Pro Tips**

### **For Active Traders:**
1. Keep the **Real-time Dashboard** open during trading hours
2. Set **Price Alerts** for your key moments
3. Monitor **Performance Dashboard** for system health
4. Use **Market Sentiment** for research before trades

### **For Long-term Investors:**
1. Set **Price Alerts** for buy/sell targets
2. Use **Market Sentiment** for trend analysis
3. Monitor **Performance Dashboard** occasionally
4. Check **Real-time Dashboard** for portfolio updates

### **For Researchers:**
1. Use **Market Sentiment** for comprehensive analysis
2. Monitor **Performance Dashboard** for data quality
3. Set **Price Alerts** for market movement tracking
4. Use **Real-time Dashboard** for live data validation

---

## 🏆 **Success Metrics**

### **What Success Looks Like:**
- ✅ **Response Times**: <500ms consistently
- ✅ **WebSocket Connection**: Stable and connected
- ✅ **Alert Accuracy**: Alerts trigger when conditions are met
- ✅ **Sentiment Analysis**: Provides actionable insights
- ✅ **System Health**: All services showing "healthy"

### **Key Performance Indicators:**
- **Portfolio Update Frequency**: Every 30 seconds
- **Alert Response Time**: <5 seconds
- **Sentiment Analysis Accuracy**: >80% confidence
- **System Uptime**: >99% availability
- **User Experience**: Smooth, responsive interface

---

## 🎉 **Getting the Most Out of kollects.io**

### **Daily Routine:**
1. **Morning**: Check Market Sentiment for market overview
2. **Trading Hours**: Keep Real-time Dashboard open
3. **Throughout Day**: Monitor Price Alerts and notifications
4. **Evening**: Review Performance Dashboard for system health

### **Weekly Review:**
1. **Analyze Alert Performance**: Which alerts were most useful
2. **Review Sentiment Predictions**: How accurate were predictions
3. **Check System Performance**: Any issues or improvements needed
4. **Update Alert Settings**: Adjust thresholds based on market conditions

### **Monthly Optimization:**
1. **Performance Review**: Analyze response times and reliability
2. **Feature Usage**: Which dashboards are most valuable
3. **Alert Optimization**: Refine alert strategies
4. **System Health**: Long-term performance trends

---

**🎯 kollects.io is designed to be your complete NFT portfolio management and trading platform. Use these dashboards together for maximum effectiveness!** 