const express = require('express');
const axios = require('axios');

const router = express.Router();

// Analytics service URL
const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://localhost:5001/api/analytics';

/**
 * Proxy route to calculate EOQ from Node.js backend
 * POST /api/analytics/eoq/calculate
 */
router.post('/eoq/calculate', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/eoq/calculate`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to calculate EOQ'
    });
  }
});

/**
 * Proxy route to forecast demand
 * POST /api/analytics/forecast/demand
 */
router.post('/forecast/demand', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/forecast/demand`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to forecast demand'
    });
  }
});

/**
 * Proxy route to analyze inventory health
 * POST /api/analytics/inventory/health
 */
router.post('/inventory/health', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/inventory/health`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to analyze inventory'
    });
  }
});

/**
 * Proxy route for ABC analysis
 * POST /api/analytics/abc-analysis
 */
router.post('/abc-analysis', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/abc-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to perform ABC analysis'
    });
  }
});

/**
 * Proxy route for sales data import
 * POST /api/analytics/sales-data/import
 * 
 * Note: React sends FormData directly to this route.
 * We need to forward it to the Python backend with proper handling.
 */
router.post('/sales-data/import', async (req, res) => {
  try {
    // Since we receive FormData from React, we need to reconstruct it
    // The file should be in req.files if using express-fileupload
    // or req.file if using multer
    
    const FormDataLib = require('form-data');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    let fileBuffer;
    let fileName;
    
    // Handle different file upload middleware approaches
    if (req.file) {
      // multer approach
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
    } else if (req.files && req.files.file) {
      // express-fileupload approach
      fileBuffer = req.files.file.data;
      fileName = req.files.file.name;
    } else if (req.body && typeof req.body === 'object') {
      // Fallback: try to extract from body (shouldn't happen with FormData)
      console.warn('Warning: No file found in standard locations, checking body');
      return res.status(400).json({
        success: false,
        error: 'No file provided in request'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      });
    }

    // Create FormData to send to Python
    const form = new FormDataLib();
    form.append('file', fileBuffer, fileName);

    // Forward to Python service
    const response = await axios.post(
      `${ANALYTICS_URL}/sales-data/import`,
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log('Sales data import successful:', response.data);
    res.json(response.data);
    
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
      res.status(error.response?.status || 500).json({
        success: false,
        error: error.response.data.error || 'Failed to import sales data'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to import sales data'
      });
    }
  }
});

/**
 * Proxy route for calculating holding cost
 * POST /api/analytics/calculate-holding-cost
 */
router.post('/calculate-holding-cost', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/calculate-holding-cost`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to calculate holding cost'
    });
  }
});

/**
 * Proxy route for calculating ordering cost
 * POST /api/analytics/calculate-ordering-cost
 */
router.post('/calculate-ordering-cost', async (req, res) => {
  try {
    const response = await axios.post(`${ANALYTICS_URL}/calculate-ordering-cost`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to calculate ordering cost'
    });
  }
});

/**
 * Proxy route to get EOQ recommendations
 * GET /api/analytics/eoq/recommendations
 */
router.get('/eoq/recommendations', async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_URL}/eoq/recommendations`);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling analytics service:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || 'Failed to fetch recommendations'
    });
  }
});

/**
 * Health check for analytics service
 * GET /api/analytics/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ANALYTICS_URL.replace('/api/analytics', '')}/api/health`);
    res.json(response.data);
  } catch (error) {
    console.error('Analytics service health check failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'Analytics service is unavailable'
    });
  }
});

module.exports = router;
