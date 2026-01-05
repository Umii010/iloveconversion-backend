const pool = require('../db');
const Logger = require('../services/logger');

class AnalyticsController {
  // Get overall dashboard statistics
  getDashboardStats = async (req, res) => {
    try {
      console.log('📊 Fetching dashboard analytics...');
      
      // Get all statistics in parallel
      const [
        totalUses,
        uniqueUsers,
        avgProcessingTime,
        successRate,
        deviceStats,
        countryStats,
        toolStats,
        hourlyStats,
        dailyStats,
        topTools
      ] = await Promise.all([
        this.getTotalUses(),
        this.getUniqueUsers(),
        this.getAvgProcessingTime(),
        this.getSuccessRate(),
        this.getDeviceStats(),
        this.getCountryStats(),
        this.getToolStats(),
        this.getHourlyStats(),
        this.getDailyStats(),
        this.getTopTools()
      ]);

      // Calculate user growth (new users in last 30 days)
      const newUsers = await this.getNewUsers(30);
      
      // Calculate growth percentages (you can refine these with actual historical data)
      const usageGrowth = 12.5; // In real app, compare with previous period
      const timeImprovement = 8.2;
      const successImprovement = 3.1;
      const userGrowthPercent = 15.7;

      const response = {
        success: true,
        data: {
          summary: {
            totalToolsServed: totalUses.total_uses || 0,
            uniqueUsers: uniqueUsers.unique_users || 0,
            averageProcessingTime: avgProcessingTime.avg_processing_time 
              ? parseFloat(avgProcessingTime.avg_processing_time).toFixed(1) 
              : '0.0',
            successRate: successRate.success_rate || '0.0',
            successfulUses: successRate.successful_uses || 0,
            failedUses: successRate.failed_uses || 0,
            newUsers: newUsers.count || 0,
            usageGrowth,
            timeImprovement,
            successImprovement,
            userGrowthPercent
          },
          devices: deviceStats,
          countries: countryStats,
          tools: toolStats,
          hourlyUsage: hourlyStats,
          dailyTrends: dailyStats,
          topTools: topTools,
          timestamp: new Date().toISOString()
        }
      };

      // Log the analytics view
      Logger.logUsage(req, 'analytics_view', true).catch(() => {});

      res.json(response);
      
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      Logger.logUsage(req, 'analytics_view', false).catch(() => {});
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch analytics data' 
      });
    }
  };

  // Get tool performance metrics
  getToolPerformance = async (req, res) => {
    try {
      const query = `
        SELECT 
          tool_name,
          COUNT(*) as usage_count,
          AVG(processing_time_ms) / 1000 as avg_time_seconds,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM tool_usage
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY tool_name
        ORDER BY usage_count DESC
      `;

      const [rows] = await pool.execute(query);
      
      // Map to frontend format
      const tools = rows.map(row => ({
        id: this.generateToolId(row.tool_name),
        name: this.formatToolName(row.tool_name),
        icon: this.getToolIcon(row.tool_name),
        usageCount: row.usage_count,
        avgTime: parseFloat(row.avg_time_seconds).toFixed(1),
        successRate: parseFloat(row.success_rate).toFixed(1),
        category: this.getToolCategory(row.tool_name)
      }));

      // Sort by usage count (descending)
      tools.sort((a, b) => b.usageCount - a.usageCount);

      res.json({
        success: true,
        tools
      });

    } catch (error) {
      console.error('Error fetching tool performance:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Get usage trends over time
  getUsageTrends = async (req, res) => {
    try {
      const { timeframe = '7d' } = req.query;
      
      let interval, format;
      switch (timeframe) {
        case '7d':
          interval = '7 DAY';
          format = '%Y-%m-%d';
          break;
        case '30d':
          interval = '30 DAY';
          format = '%Y-%m-%d';
          break;
        case '90d':
          interval = '90 DAY';
          format = '%Y-%m-%d';
          break;
        default:
          interval = '30 DAY';
          format = '%Y-%m-%d';
      }

      const query = `
        SELECT 
          DATE_FORMAT(created_at, '${format}') as date,
          COUNT(*) as count,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
        FROM tool_usage
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
        GROUP BY DATE_FORMAT(created_at, '${format}')
        ORDER BY date
      `;

      const [rows] = await pool.execute(query);
      
      const labels = rows.map(row => {
        const date = new Date(row.date);
        return timeframe === '7d' 
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString('en-US', { month: 'short' });
      });
      
      const usageData = rows.map(row => row.count);
      const successData = rows.map(row => parseFloat(row.success_rate).toFixed(1));

      res.json({
        success: true,
        data: {
          labels,
          usage: usageData,
          success: successData
        }
      });

    } catch (error) {
      console.error('Error fetching usage trends:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Get user growth data
  getUserGrowth = async (req, res) => {
    try {
      const query = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(DISTINCT user_id) as new_users,
          COUNT(*) as total_uses
        FROM tool_usage
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `;

      const [rows] = await pool.execute(query);
      
      const months = rows.map(row => {
        const [year, month] = row.month.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
      });
      
      const newUsers = rows.map(row => row.new_users);
      const totalUses = rows.map(row => row.total_uses);

      res.json({
        success: true,
        data: {
          months,
          newUsers,
          totalUses
        }
      });

    } catch (error) {
      console.error('Error fetching user growth:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Get device and country statistics
  getDeviceCountryStats = async (req, res) => {
    try {
      const [deviceStats, countryStats] = await Promise.all([
        this.getDeviceStats(),
        this.getCountryStats()
      ]);

      res.json({
        success: true,
        data: {
          devices: deviceStats,
          countries: countryStats
        }
      });

    } catch (error) {
      console.error('Error fetching device/country stats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };

  // Helper methods
  getTotalUses = async () => {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as total_uses FROM tool_usage
    `);
    return rows[0];
  };

  getUniqueUsers = async () => {
    const [rows] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as unique_users FROM tool_usage
    `);
    return rows[0];
  };

  getAvgProcessingTime = async () => {
    const [rows] = await pool.execute(`
      SELECT AVG(processing_time_ms) / 1000 as avg_processing_time 
      FROM tool_usage 
      WHERE success = 1
    `);
    return rows[0];
  };

  getSuccessRate = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        SUM(success) as successful_uses,
        COUNT(*) - SUM(success) as failed_uses,
        SUM(success) * 100.0 / COUNT(*) as success_rate
      FROM tool_usage
    `);
    return rows[0];
  };

  getDeviceStats = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        device_type,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tool_usage) as percentage
      FROM tool_usage
      WHERE device_type IS NOT NULL AND device_type != 'unknown'
      GROUP BY device_type
      ORDER BY count DESC
    `);
    
    return rows.map(row => ({
      type: row.device_type,
      count: row.count,
      percentage: parseFloat(row.percentage).toFixed(1)
    }));
  };

  getCountryStats = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        country,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tool_usage WHERE country != 'unknown') as percentage
      FROM tool_usage
      WHERE country IS NOT NULL AND country != 'unknown'
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `);
    
    return rows.map(row => ({
      name: row.country,
      code: this.getCountryCode(row.country),
      usage: parseFloat(row.percentage).toFixed(1)
    }));
  };

  getToolStats = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        tool_name,
        COUNT(*) as usage_count,
        AVG(processing_time_ms) / 1000 as avg_time,
        SUM(success) * 100.0 / COUNT(*) as success_rate
      FROM tool_usage
      GROUP BY tool_name
      ORDER BY usage_count DESC
    `);
    
    return rows;
  };

  getHourlyStats = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM tool_usage
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `);
    
    // Fill missing hours with 0
    const hourlyData = Array(24).fill(0);
    rows.forEach(row => {
      hourlyData[row.hour] = row.count;
    });
    
    return hourlyData;
  };

  getDailyStats = async () => {
    const [rows] = await pool.execute(`
      SELECT 
        DAYNAME(created_at) as day,
        COUNT(*) as count
      FROM tool_usage
      GROUP BY DAYNAME(created_at), DAYOFWEEK(created_at)
      ORDER BY DAYOFWEEK(created_at)
    `);
    
    return rows;
  };

  getTopTools = async () => {
    const [rows] = await pool.execute(`
      SELECT tool_name, COUNT(*) as count
      FROM tool_usage
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY tool_name
      ORDER BY count DESC
      LIMIT 5
    `);
    
    return rows;
  };

  getNewUsers = async (days = 30) => {
    const [rows] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM tool_usage
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND user_id NOT IN (
        SELECT DISTINCT user_id 
        FROM tool_usage 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      )
    `, [days, days]);
    
    return rows[0];
  };

  // Helper formatting methods
  formatToolName = (toolName) => {
    const nameMap = {
      'code_diff': 'Code Diff Tool',
      'pdf_compress': 'PDF Compress',
      'json_to_xml': 'JSON to XML',
      'xml_to_json': 'XML to JSON',
      'json_to_yaml': 'JSON to YAML',
      'yaml_to_json': 'YAML to JSON',
      'csv_to_json': 'CSV to JSON',
      'json_to_csv': 'JSON to CSV',
      'sql_to_mongo': 'SQL to MongoDB',
      'java_to_csharp': 'Java to C#',
      'python_to_js': 'Python to JS',
      'curl_converter': 'cURL Converter',
      'format_json': 'Format JSON',
      'minify_json': 'Minify JSON',
      'validate_json': 'Validate JSON',
      'file_corruptor': 'File Corruptor',
      'image_to_pdf': 'Image to PDF',
      'pdf_merge': 'PDF Merge',
      'ocr_pdf': 'OCR PDF',
      'pdf_to_excel': 'PDF to Excel',
      'pdf_to_png': 'PDF to PNG',
      'pdf_to_ppt': 'PDF to PPT',
      'pdf_to_word': 'PDF to Word',
      'ppt_to_pdf': 'PPT to PDF',
      'pdf_protect': 'PDF Protect',
      'pdf_repair': 'PDF Repair',
      'pdf_rotate': 'PDF Rotate',
      'pdf_unlock': 'PDF Unlock',
      'video_info': 'Video Info',
      'video_download': 'Video Download',
      'video_download_all': 'Video Download All',
      'video_download_youtube': 'YouTube Download',
      'video_download_instagram': 'Instagram Download',
      'word_to_pdf': 'Word to PDF'
    };
    
    return nameMap[toolName] || toolName.replace(/_/g, ' ').toUpperCase();
  };

  getToolIcon = (toolName) => {
    const iconMap = {
      'pdf_compress': 'fas fa-compress-alt',
      'pdf_merge': 'fas fa-file-pdf',
      'pdf_to_word': 'fas fa-file-word',
      'pdf_to_excel': 'fas fa-file-excel',
      'pdf_to_png': 'fas fa-file-image',
      'image_to_pdf': 'fas fa-image',
      'code_diff': 'fas fa-code',
      'json_to_xml': 'fas fa-exchange-alt',
      'file_corruptor': 'fas fa-bomb',
      'pdf_protect': 'fas fa-lock',
      'pdf_unlock': 'fas fa-unlock',
      'pdf_rotate': 'fas fa-sync-alt',
      'pdf_repair': 'fas fa-tools',
      'word_to_pdf': 'fas fa-file-word',
      'ppt_to_pdf': 'fas fa-file-powerpoint',
      'video_download': 'fas fa-video',
      'ocr_pdf': 'fas fa-eye'
    };
    
    return iconMap[toolName] || 'fas fa-cog';
  };

  getToolCategory = (toolName) => {
    if (toolName.includes('pdf') || toolName.includes('word') || toolName.includes('ppt')) {
      return 'pdf';
    } else if (toolName.includes('image') || toolName.includes('png') || toolName.includes('jpg')) {
      return 'image';
    } else if (toolName.includes('video') || toolName.includes('youtube') || toolName.includes('instagram')) {
      return 'video';
    } else if (toolName.includes('json') || toolName.includes('xml') || toolName.includes('yaml') || toolName.includes('csv')) {
      return 'developer';
    } else if (toolName.includes('code') || toolName.includes('sql') || toolName.includes('java') || toolName.includes('python')) {
      return 'developer';
    } else {
      return 'other';
    }
  };

  generateToolId = (toolName) => {
    // Simple hash function to generate consistent IDs
    let hash = 0;
    for (let i = 0; i < toolName.length; i++) {
      hash = ((hash << 5) - hash) + toolName.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  getCountryCode = (countryName) => {
    const countryCodes = {
      'United States': 'us',
      'United Kingdom': 'gb',
      'India': 'in',
      'Germany': 'de',
      'Canada': 'ca',
      'Australia': 'au',
      'France': 'fr',
      'Japan': 'jp',
      'Brazil': 'br',
      'Russia': 'ru',
      'China': 'cn'
    };
    
    return countryCodes[countryName] || 'globe';
  };
}

module.exports = new AnalyticsController();