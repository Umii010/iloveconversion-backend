// const pool = require('../db');
// const Logger = {
//   async logUsage(req, toolName, success = true) {
//     try {
//       if (!req.userInfo || !req.userInfo.has_given_consent) {
//         console.log(`Skipping tool logging - user hasn't given consent: ${toolName}`);
//         return false;
//       }
//             if (toolName === 'analytics_view' || 
//           toolName === 'analytics' ||
//           toolName.includes('analytics')) {
//         console.log(`Skipping analytics logging for: ${toolName}`);
//         return false;
//       }
      
//       const processingTimeMs = Date.now() - req.startTime;
//       const { user_id, device_type, country } = req.userInfo;
      
//       console.log(`📝 Logging tool usage: ${toolName} for user: ${user_id}`);
      
//       const checkUserQuery = `
//         SELECT id FROM tool_usage WHERE user_id = ? LIMIT 1
//       `;
      
//       const [existingUser] = await pool.execute(checkUserQuery, [user_id]);
      
//       if (existingUser.length === 0) {
//         console.log(`👤 First tool usage for user ${user_id}`);
//                 const checkToolQuery = `
//           SELECT id FROM tool_usage 
//           WHERE user_id = ? AND tool_name = ?
//           LIMIT 1
//         `;
        
//         const [existingTool] = await pool.execute(checkToolQuery, [user_id, toolName]);
        
//         if (existingTool.length === 0) {
//           console.log(`🆕 Logging new tool ${toolName} for user ${user_id}`);
//           const insertQuery = `
//             INSERT INTO tool_usage 
//             (user_id, tool_name, device_type, country, processing_time_ms, success, usage_count)
//             VALUES (?, ?, ?, ?, ?, ?, 1)
//           `;
//           await pool.execute(insertQuery, [
//             user_id,
//             toolName,
//             device_type,
//             country,
//             processingTimeMs,
//             success
//           ]);
//         } else {
//           console.log(`🔄 Updating existing tool ${toolName} for user ${user_id}`);
//           const updateQuery = `
//             UPDATE tool_usage 
//             SET 
//               usage_count = usage_count + 1,
//               processing_time_ms = ?,
//               last_used_at = NOW(),
//               success = ?,
//               device_type = COALESCE(?, device_type),
//               country = COALESCE(?, country),
//               updated_at = NOW()
//             WHERE user_id = ? AND tool_name = ?
//           `;
//           await pool.execute(updateQuery, [
//             processingTimeMs,
//             success,
//             device_type,
//             country,
//             user_id,
//             toolName
//           ]);
//         }
//       } else {
//         console.log(`🔄 Updating tool usage for existing user ${user_id}`);
//                 const checkToolQuery = `
//           SELECT id FROM tool_usage 
//           WHERE user_id = ? AND tool_name = ?
//           LIMIT 1
//         `;
        
//         const [existingTool] = await pool.execute(checkToolQuery, [user_id, toolName]);
        
//         if (existingTool.length === 0) {
//           console.log(` Adding new tool ${toolName} to existing user ${user_id}`);
//           const insertQuery = `
//             INSERT INTO tool_usage 
//             (user_id, tool_name, device_type, country, processing_time_ms, success, usage_count)
//             VALUES (?, ?, ?, ?, ?, ?, 1)
//           `;
//           await pool.execute(insertQuery, [
//             user_id,
//             toolName,
//             device_type,
//             country,
//             processingTimeMs,
//             success
//           ]);
//         } else {
//           console.log(`Updating existing tool ${toolName} for user ${user_id}`);
//           const updateQuery = `
//             UPDATE tool_usage 
//             SET 
//               usage_count = usage_count + 1,
//               processing_time_ms = ?,
//               last_used_at = NOW(),
//               success = ?,
//               device_type = COALESCE(?, device_type),
//               country = COALESCE(?, country),
//               updated_at = NOW()
//             WHERE user_id = ? AND tool_name = ?
//           `;
//           await pool.execute(updateQuery, [
//             processingTimeMs,
//             success,
//             device_type,
//             country,
//             user_id,
//             toolName
//           ]);
//         }
//       }
      
//       console.log(` Successfully logged ${toolName} for user ${user_id}`);
//       return true;
//     } catch (error) {
//       console.error('Error logging to database:', error.message);
//       console.error('Error details:', error);
//       return false;
//     }
//   }
// };

// module.exports = Logger;