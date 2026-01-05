const pool = require('../db');
const Logger = {
  async logUsage(req, toolName, success = true) {
    try {
      if (!req.userInfo || 
          toolName === 'analytics_view' || 
          toolName === 'analytics' ||
          toolName.includes('analytics')) {
        console.log(`⏭️ Skipping analytics logging for: ${toolName}`);
        return false;
      }
      
      const processingTimeMs = Date.now() - req.startTime;
      const { user_id, device_type, country } = req.userInfo;
      
      console.log(`📝 Attempting to log: ${toolName} for user: ${user_id}`);
      const checkQuery = `
        SELECT id FROM tool_usage 
        WHERE user_id = ? AND tool_name = ?
        LIMIT 1
      `;
      
      const [existing] = await pool.execute(checkQuery, [user_id, toolName]);
      
      if (existing.length > 0) {
        console.log(`🔄 Updating existing record for ${toolName}`);
        const updateQuery = `
          UPDATE tool_usage 
          SET 
            usage_count = usage_count + 1,
            processing_time_ms = ?,
            last_used_at = NOW(),
            success = ?,
            device_type = COALESCE(?, device_type),
            country = COALESCE(?, country),
            updated_at = NOW()
          WHERE user_id = ? AND tool_name = ?
        `;
        await pool.execute(updateQuery, [
          processingTimeMs,
          success,
          device_type,
          country,
          user_id,
          toolName
        ]);
        console.log(`✅ Updated ${toolName} for user ${user_id}`);
        return true;
      } else {
        console.log(`🆕 Creating new record for ${toolName}`);
        const insertQuery = `
          INSERT INTO tool_usage 
          (user_id, tool_name, device_type, country, processing_time_ms, success, usage_count)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `;
        await pool.execute(insertQuery, [
          user_id,
          toolName,
          device_type,
          country,
          processingTimeMs,
          success
        ]);
        console.log(`Logged ${toolName} for new user ${user_id}`);
        return true;
      }
    } catch (error) {
      console.error('Error logging to database:', error.message);
      console.error('Error details:', error);
      return false;
    }
  }
};
module.exports = Logger;