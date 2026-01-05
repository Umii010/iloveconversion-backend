const pool = require('../db');

const Logger = {
  async logUsage(req, toolName, success = true) {
    try {
      if (!success) return false;

      const processingTimeMs = Date.now() - req.startTime;

      const query = `
        INSERT INTO tool_usage 
        (tool_name, user_id, device_type, country, processing_time_ms, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        toolName,
        req.userInfo?.user_id || 'anonymous',
        req.userInfo?.device_type || 'unknown',
        req.userInfo?.country || 'unknown',
        processingTimeMs,
        success
      ];

      const [result] = await pool.execute(query, values);
      console.log(`Logged ${toolName} usage: ID ${result.insertId}`);
      return true;
      
    } catch (error) {
      console.error('Error logging to database:', error.message);
      return false;
    }
  }
};

module.exports = Logger;