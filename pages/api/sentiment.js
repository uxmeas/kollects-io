// Market Sentiment Analysis API endpoints
// Handles sentiment analysis operations and data retrieval

import { marketSentimentService } from '../../lib/market-sentiment-service.js';

export default async function handler(req, res) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('❌ Sentiment API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// GET /api/sentiment - Get sentiment analysis data
async function handleGet(req, res) {
  const { momentId, overview, bulk } = req.query;

  try {
    if (overview) {
      // Get market overview
      const overview = marketSentimentService.getMarketOverview();
      return res.status(200).json(overview);
    }

    if (bulk) {
      // Get bulk sentiment analysis for multiple moments
      const momentIds = bulk.split(',').map(id => id.trim());
      const analyses = await marketSentimentService.getBulkSentimentAnalysis(momentIds);
      return res.status(200).json({ analyses });
    }

    if (momentId) {
      // Get sentiment analysis for specific moment
      const analysis = await marketSentimentService.getSentimentAnalysis(momentId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Sentiment analysis not found for this moment' });
      }
      
      return res.status(200).json({ analysis });
    }

    // Get service stats
    const stats = marketSentimentService.getStats();
    return res.status(200).json({ stats });

  } catch (error) {
    console.error('❌ Error getting sentiment data:', error);
    res.status(500).json({ error: 'Failed to get sentiment data' });
  }
}

// POST /api/sentiment - Start sentiment analysis
async function handlePost(req, res) {
  const { momentId, options = {} } = req.body;

  if (!momentId) {
    return res.status(400).json({ 
      error: 'momentId is required' 
    });
  }

  try {
    await marketSentimentService.startSentimentAnalysis(momentId, options);
    
    return res.status(201).json({
      message: 'Sentiment analysis started successfully',
      momentId,
      options
    });

  } catch (error) {
    console.error('❌ Error starting sentiment analysis:', error);
    res.status(500).json({ error: 'Failed to start sentiment analysis' });
  }
}

// DELETE /api/sentiment - Stop sentiment analysis
async function handleDelete(req, res) {
  const { momentId, all } = req.query;

  try {
    if (all) {
      // Stop all sentiment analysis
      marketSentimentService.stopAllAnalysis();
      return res.status(200).json({
        message: 'All sentiment analysis stopped successfully'
      });
    }

    if (!momentId) {
      return res.status(400).json({ error: 'momentId is required' });
    }

    // Stop analysis for specific moment
    marketSentimentService.stopSentimentAnalysis(momentId);
    
    return res.status(200).json({
      message: 'Sentiment analysis stopped successfully',
      momentId
    });

  } catch (error) {
    console.error('❌ Error stopping sentiment analysis:', error);
    res.status(500).json({ error: 'Failed to stop sentiment analysis' });
  }
} 