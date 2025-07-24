// Price Alerts API endpoints
// Handles CRUD operations for price alerts

import { priceAlertService } from '../../lib/price-alert-service.js';

export default async function handler(req, res) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('❌ Alerts API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// GET /api/alerts - Get alerts for a wallet
async function handleGet(req, res) {
  const { walletAddress, alertId, history } = req.query;

  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  try {
    if (alertId) {
      // Get specific alert
      const alerts = priceAlertService.getAlerts(walletAddress);
      const alert = alerts.find(a => a.id === alertId);
      
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      
      return res.status(200).json({ alert });
    }

    if (history) {
      // Get notification history
      const notifications = await priceAlertService.getNotificationHistory(walletAddress, 20);
      return res.status(200).json({ notifications });
    }

    // Get all alerts for wallet
    const alerts = priceAlertService.getAlerts(walletAddress);
    const activeAlerts = priceAlertService.getActiveAlerts(walletAddress);
    
    return res.status(200).json({
      alerts,
      activeAlerts,
      stats: {
        total: alerts.length,
        active: activeAlerts.length,
        inactive: alerts.length - activeAlerts.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
}

// POST /api/alerts - Create a new alert
async function handlePost(req, res) {
  const { walletAddress, momentId, ...options } = req.body;

  if (!walletAddress || !momentId) {
    return res.status(400).json({ 
      error: 'walletAddress and momentId are required' 
    });
  }

  try {
    const alert = priceAlertService.createAlert(walletAddress, momentId, options);
    
    return res.status(201).json({
      message: 'Alert created successfully',
      alert
    });

  } catch (error) {
    console.error('❌ Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
}

// PUT /api/alerts - Update an alert
async function handlePut(req, res) {
  const { alertId, ...updates } = req.body;

  if (!alertId) {
    return res.status(400).json({ error: 'alertId is required' });
  }

  try {
    const updatedAlert = priceAlertService.updateAlert(alertId, updates);
    
    if (!updatedAlert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(200).json({
      message: 'Alert updated successfully',
      alert: updatedAlert
    });

  } catch (error) {
    console.error('❌ Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
}

// DELETE /api/alerts - Delete an alert
async function handleDelete(req, res) {
  const { alertId } = req.query;

  if (!alertId) {
    return res.status(400).json({ error: 'alertId is required' });
  }

  try {
    const deleted = priceAlertService.deleteAlert(alertId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    return res.status(200).json({
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
} 