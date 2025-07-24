// Market Sentiment Analysis Service for kollects.io
// Analyzes social media sentiment, trading volume, and provides trend predictions

import { cacheService } from './redis-cache.js';
import { smartPolling } from './smart-polling.js';

class MarketSentimentService {
  constructor() {
    this.sentimentData = new Map(); // momentId -> sentimentHistory[]
    this.volumeData = new Map(); // momentId -> volumeHistory[]
    this.trendPredictions = new Map(); // momentId -> prediction[]
    this.socialMediaSources = ['twitter', 'reddit', 'discord'];
    this.analysisIntervals = new Map(); // momentId -> intervalId
    this.sentimentThresholds = {
      bullish: 0.6,
      bearish: -0.6,
      neutral: 0.2
    };
  }

  // Start sentiment analysis for a moment
  async startSentimentAnalysis(momentId, options = {}) {
    if (this.analysisIntervals.has(momentId)) {
      return; // Already analyzing
    }

    const interval = options.interval || 300000; // 5 minutes default
    const sources = options.sources || this.socialMediaSources;

    const analyze = async () => {
      try {
        console.log(`📊 Analyzing sentiment for moment ${momentId}`);
        
        // Collect data from multiple sources
        const [sentimentData, volumeData] = await Promise.all([
          this.collectSocialMediaSentiment(momentId, sources),
          this.collectTradingVolume(momentId)
        ]);

        // Analyze sentiment
        const sentimentAnalysis = this.analyzeSentiment(sentimentData);
        
        // Analyze volume patterns
        const volumeAnalysis = this.analyzeVolume(volumeData);
        
        // Generate trend prediction
        const trendPrediction = this.generateTrendPrediction(sentimentAnalysis, volumeAnalysis);
        
        // Store results
        this.storeSentimentData(momentId, sentimentAnalysis);
        this.storeVolumeData(momentId, volumeAnalysis);
        this.storeTrendPrediction(momentId, trendPrediction);

        // Cache results
        await this.cacheAnalysisResults(momentId, {
          sentiment: sentimentAnalysis,
          volume: volumeAnalysis,
          trend: trendPrediction,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ Sentiment analysis completed for moment ${momentId}`);
        
        return {
          momentId,
          sentiment: sentimentAnalysis,
          volume: volumeAnalysis,
          trend: trendPrediction
        };

      } catch (error) {
        console.error(`❌ Error analyzing sentiment for moment ${momentId}:`, error.message);
        throw error;
      }
    };

    // Start initial analysis
    await analyze();
    
    // Set up periodic analysis
    const intervalId = setInterval(analyze, interval);
    this.analysisIntervals.set(momentId, intervalId);

    console.log(`🚀 Started sentiment analysis for moment ${momentId} (${interval/1000}s intervals)`);
  }

  // Stop sentiment analysis for a moment
  stopSentimentAnalysis(momentId) {
    const intervalId = this.analysisIntervals.get(momentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.analysisIntervals.delete(momentId);
      console.log(`🛑 Stopped sentiment analysis for moment ${momentId}`);
    }
  }

  // Collect social media sentiment data
  async collectSocialMediaSentiment(momentId, sources) {
    const sentimentData = {
      twitter: [],
      reddit: [],
      discord: [],
      overall: {
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0
      }
    };

    // Simulate social media data collection
    for (const source of sources) {
      const sourceData = await this.simulateSocialMediaData(momentId, source);
      sentimentData[source] = sourceData;
      
      // Aggregate overall sentiment
      sentimentData.overall.positive += sourceData.positive;
      sentimentData.overall.negative += sourceData.negative;
      sentimentData.overall.neutral += sourceData.neutral;
      sentimentData.overall.total += sourceData.total;
    }

    return sentimentData;
  }

  // Simulate social media data (replace with real API calls)
  async simulateSocialMediaData(momentId, source) {
    // Simulate realistic social media sentiment
    const baseSentiment = Math.random() * 2 - 1; // -1 to 1
    const volatility = 0.3;
    const noise = (Math.random() - 0.5) * volatility;
    const sentiment = Math.max(-1, Math.min(1, baseSentiment + noise));

    const total = Math.floor(Math.random() * 100) + 10;
    const positive = Math.floor(total * Math.max(0, sentiment) * 0.8);
    const negative = Math.floor(total * Math.max(0, -sentiment) * 0.8);
    const neutral = total - positive - negative;

    return {
      source,
      momentId,
      sentiment,
      positive,
      negative,
      neutral,
      total,
      timestamp: new Date().toISOString(),
      keywords: this.generateKeywords(momentId, source),
      trending: Math.random() > 0.7 // 30% chance of trending
    };
  }

  // Generate relevant keywords for sentiment analysis
  generateKeywords(momentId, source) {
    const keywords = [
      'NBA Top Shot', 'NFL All Day', 'moment', 'collectible',
      'blockchain', 'NFT', 'trading', 'investment', 'rare',
      'legendary', 'common', 'player', 'team', 'sport'
    ];
    
    // Randomly select 3-5 keywords
    const selected = [];
    const count = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < count; i++) {
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      if (!selected.includes(keyword)) {
        selected.push(keyword);
      }
    }
    
    return selected;
  }

  // Collect trading volume data
  async collectTradingVolume(momentId) {
    // Simulate trading volume data
    const baseVolume = Math.random() * 1000 + 100;
    const volatility = 0.4;
    const change = (Math.random() - 0.5) * volatility;
    const currentVolume = Math.max(0, baseVolume * (1 + change));

    return {
      momentId,
      currentVolume,
      averageVolume: baseVolume,
      volumeChange: change * 100,
      volumeTrend: change > 0 ? 'increasing' : 'decreasing',
      timestamp: new Date().toISOString(),
      transactions: Math.floor(currentVolume / 10),
      uniqueTraders: Math.floor(Math.random() * 50) + 5
    };
  }

  // Analyze sentiment data
  analyzeSentiment(sentimentData) {
    const { overall } = sentimentData;
    
    if (overall.total === 0) {
      return {
        score: 0,
        sentiment: 'neutral',
        confidence: 0,
        sources: sentimentData
      };
    }

    const positiveRatio = overall.positive / overall.total;
    const negativeRatio = overall.negative / overall.total;
    const neutralRatio = overall.neutral / overall.total;

    // Calculate sentiment score (-1 to 1)
    const score = positiveRatio - negativeRatio;
    
    // Determine sentiment category
    let sentiment = 'neutral';
    if (score > this.sentimentThresholds.bullish) {
      sentiment = 'bullish';
    } else if (score < this.sentimentThresholds.bearish) {
      sentiment = 'bearish';
    }

    // Calculate confidence based on total mentions
    const confidence = Math.min(1, overall.total / 100);

    return {
      score: Math.round(score * 100) / 100,
      sentiment,
      confidence: Math.round(confidence * 100) / 100,
      breakdown: {
        positive: Math.round(positiveRatio * 100),
        negative: Math.round(negativeRatio * 100),
        neutral: Math.round(neutralRatio * 100)
      },
      sources: sentimentData,
      timestamp: new Date().toISOString()
    };
  }

  // Analyze volume patterns
  analyzeVolume(volumeData) {
    const { currentVolume, averageVolume, volumeChange } = volumeData;
    
    const volumeRatio = currentVolume / averageVolume;
    let volumeSignal = 'normal';
    
    if (volumeRatio > 1.5) {
      volumeSignal = 'high';
    } else if (volumeRatio < 0.5) {
      volumeSignal = 'low';
    }

    return {
      currentVolume,
      averageVolume,
      volumeChange: Math.round(volumeChange * 100) / 100,
      volumeSignal,
      volumeRatio: Math.round(volumeRatio * 100) / 100,
      timestamp: new Date().toISOString()
    };
  }

  // Generate trend prediction based on sentiment and volume
  generateTrendPrediction(sentimentAnalysis, volumeAnalysis) {
    const { score, sentiment, confidence } = sentimentAnalysis;
    const { volumeSignal, volumeChange } = volumeAnalysis;

    // Combine sentiment and volume signals
    let trendSignal = 'neutral';
    let confidenceMultiplier = 1;
    let priceDirection = 0;

    // Sentiment impact
    if (sentiment === 'bullish') {
      priceDirection += 0.6;
      confidenceMultiplier += 0.2;
    } else if (sentiment === 'bearish') {
      priceDirection -= 0.6;
      confidenceMultiplier += 0.2;
    }

    // Volume impact
    if (volumeSignal === 'high' && volumeChange > 0) {
      priceDirection += 0.3;
      confidenceMultiplier += 0.1;
    } else if (volumeSignal === 'low' && volumeChange < 0) {
      priceDirection -= 0.3;
      confidenceMultiplier += 0.1;
    }

    // Determine trend signal
    if (priceDirection > 0.5) {
      trendSignal = 'bullish';
    } else if (priceDirection < -0.5) {
      trendSignal = 'bearish';
    }

    const finalConfidence = Math.min(1, confidence * confidenceMultiplier);

    return {
      trendSignal,
      priceDirection: Math.round(priceDirection * 100) / 100,
      confidence: Math.round(finalConfidence * 100) / 100,
      factors: {
        sentiment: sentiment,
        sentimentScore: score,
        volumeSignal: volumeSignal,
        volumeChange: volumeChange
      },
      recommendation: this.generateRecommendation(trendSignal, finalConfidence),
      timestamp: new Date().toISOString()
    };
  }

  // Generate trading recommendation
  generateRecommendation(trendSignal, confidence) {
    if (confidence < 0.3) {
      return 'Hold - Insufficient data for recommendation';
    }

    switch (trendSignal) {
      case 'bullish':
        return confidence > 0.7 ? 'Strong Buy' : 'Buy';
      case 'bearish':
        return confidence > 0.7 ? 'Strong Sell' : 'Sell';
      default:
        return 'Hold - Neutral market conditions';
    }
  }

  // Store sentiment data
  storeSentimentData(momentId, sentimentAnalysis) {
    if (!this.sentimentData.has(momentId)) {
      this.sentimentData.set(momentId, []);
    }
    
    const history = this.sentimentData.get(momentId);
    history.push(sentimentAnalysis);
    
    // Keep only last 24 entries (2 hours at 5-minute intervals)
    if (history.length > 24) {
      history.shift();
    }
  }

  // Store volume data
  storeVolumeData(momentId, volumeAnalysis) {
    if (!this.volumeData.has(momentId)) {
      this.volumeData.set(momentId, []);
    }
    
    const history = this.volumeData.get(momentId);
    history.push(volumeAnalysis);
    
    // Keep only last 24 entries
    if (history.length > 24) {
      history.shift();
    }
  }

  // Store trend prediction
  storeTrendPrediction(momentId, trendPrediction) {
    this.trendPredictions.set(momentId, trendPrediction);
  }

  // Cache analysis results
  async cacheAnalysisResults(momentId, results) {
    const key = `sentiment:${momentId}`;
    await cacheService.set(key, results, 3600); // 1 hour cache
  }

  // Get sentiment analysis for a moment
  async getSentimentAnalysis(momentId) {
    // Try cache first
    const cached = await cacheService.get(`sentiment:${momentId}`);
    if (cached) {
      return cached;
    }

    // Return latest from memory
    const sentimentHistory = this.sentimentData.get(momentId) || [];
    const volumeHistory = this.volumeData.get(momentId) || [];
    const trendPrediction = this.trendPredictions.get(momentId);

    if (sentimentHistory.length === 0) {
      return null;
    }

    return {
      sentiment: sentimentHistory[sentimentHistory.length - 1],
      volume: volumeHistory[volumeHistory.length - 1],
      trend: trendPrediction,
      history: {
        sentiment: sentimentHistory.slice(-6), // Last 30 minutes
        volume: volumeHistory.slice(-6)
      }
    };
  }

  // Get sentiment analysis for multiple moments
  async getBulkSentimentAnalysis(momentIds) {
    const results = {};
    
    for (const momentId of momentIds) {
      const analysis = await this.getSentimentAnalysis(momentId);
      if (analysis) {
        results[momentId] = analysis;
      }
    }
    
    return results;
  }

  // Get market overview
  getMarketOverview() {
    const activeMoments = Array.from(this.sentimentData.keys());
    const analyses = activeMoments.map(momentId => {
      const sentimentHistory = this.sentimentData.get(momentId) || [];
      const volumeHistory = this.volumeData.get(momentId) || [];
      const trendPrediction = this.trendPredictions.get(momentId);
      
      return {
        momentId,
        latestSentiment: sentimentHistory[sentimentHistory.length - 1],
        latestVolume: volumeHistory[volumeHistory.length - 1],
        trendPrediction
      };
    });

    // Calculate market-wide sentiment
    const sentimentScores = analyses
      .map(a => a.latestSentiment?.score || 0)
      .filter(score => score !== 0);
    
    const averageSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    return {
      totalMoments: activeMoments.length,
      averageSentiment: Math.round(averageSentiment * 100) / 100,
      marketSentiment: this.getSentimentCategory(averageSentiment),
      bullishMoments: analyses.filter(a => a.trendPrediction?.trendSignal === 'bullish').length,
      bearishMoments: analyses.filter(a => a.trendPrediction?.trendSignal === 'bearish').length,
      neutralMoments: analyses.filter(a => a.trendPrediction?.trendSignal === 'neutral').length,
      analyses
    };
  }

  // Get sentiment category
  getSentimentCategory(score) {
    if (score > this.sentimentThresholds.bullish) return 'bullish';
    if (score < this.sentimentThresholds.bearish) return 'bearish';
    return 'neutral';
  }

  // Get stats
  getStats() {
    return {
      activeMoments: this.sentimentData.size,
      activeAnalyses: this.analysisIntervals.size,
      sentimentDataSize: Array.from(this.sentimentData.values()).reduce((sum, history) => sum + history.length, 0),
      volumeDataSize: Array.from(this.volumeData.values()).reduce((sum, history) => sum + history.length, 0),
      trendPredictions: this.trendPredictions.size
    };
  }

  // Stop all sentiment analysis
  stopAllAnalysis() {
    for (const momentId of this.analysisIntervals.keys()) {
      this.stopSentimentAnalysis(momentId);
    }
  }
}

export const marketSentimentService = new MarketSentimentService(); 