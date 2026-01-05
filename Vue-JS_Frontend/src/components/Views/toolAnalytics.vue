<template>
  <div class="analytics-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>Unable to Load Analytics</h3>
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>

    <!-- Main Dashboard Content -->
    <div v-else>
      <!-- Header Section -->
      <header class="dashboard-header">
        <h1><i class="fas fa-chart-line"></i> Tools Performance Analytics</h1>
        <p class="subtitle">Real-time usage, performance, and engagement metrics across all tools</p>
        <div class="header-info">
          <div class="last-updated">
            <i class="fas fa-sync-alt"></i>
            Last updated: {{ formatDate(lastUpdated) }}
          </div>
          <div class="data-range">
            <i class="fas fa-calendar-alt"></i>
            Data from last 30 days
          </div>
        </div>
      </header>

      <!-- Summary Stats Cards -->
      <section class="summary-stats">
        <div class="stat-card total-usage">
          <div class="stat-content">
            <h3>Total Tools Served</h3>
            <p class="stat-number">{{ formatNumber(dashboardStats.summary?.totalToolsServed || 0) }}</p>
            <p class="stat-change" :class="dashboardStats.summary?.usageGrowth >= 0 ? 'positive' : 'negative'">
              <i :class="dashboardStats.summary?.usageGrowth >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(dashboardStats.summary?.usageGrowth || 0) }}% from last month
            </p>
          </div>
        </div>

        <div class="stat-card avg-time">
          <div class="stat-content">
            <h3>Average Processing Time</h3>
            <p class="stat-number">{{ dashboardStats.summary?.averageProcessingTime || '0.0' }}s</p>
            <p class="stat-change" :class="dashboardStats.summary?.timeImprovement >= 0 ? 'positive' : 'negative'">
              <i :class="dashboardStats.summary?.timeImprovement >= 0 ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i>
              {{ Math.abs(dashboardStats.summary?.timeImprovement || 0) }}% {{ dashboardStats.summary?.timeImprovement >= 0 ? 'faster' : 'slower' }}
            </p>
          </div>
        </div>

        <div class="stat-card success-rate">
          <div class="stat-content">
            <h3>Success Rate</h3>
            <p class="stat-number">{{ parseFloat(dashboardStats.summary?.successRate || 0).toFixed(1) }}%</p>
            <div class="success-details">
              <span class="success-count">{{ formatNumber(dashboardStats.summary?.successfulUses || 0) }} successful</span>
              <span class="failure-count">{{ formatNumber(dashboardStats.summary?.failedUses || 0) }} failed</span>
            </div>
            <p class="stat-change" :class="dashboardStats.summary?.successImprovement >= 0 ? 'positive' : 'negative'">
              <i :class="dashboardStats.summary?.successImprovement >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(dashboardStats.summary?.successImprovement || 0) }}% improvement
            </p>
          </div>
        </div>

        <div class="stat-card user-growth">
          <div class="stat-content">
            <h3>User Activity</h3>
            <p class="stat-number">{{ formatNumber(dashboardStats.summary?.uniqueUsers || 0) }}</p>
            <div class="user-details">
              <span class="new-users">+{{ formatNumber(dashboardStats.summary?.newUsers || 0) }} new</span>
              <span class="total-uses">{{ formatNumber(dashboardStats.summary?.totalToolsServed || 0) }} total uses</span>
            </div>
            <p class="stat-change" :class="dashboardStats.summary?.userGrowthPercent >= 0 ? 'positive' : 'negative'">
              <i :class="dashboardStats.summary?.userGrowthPercent >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(dashboardStats.summary?.userGrowthPercent || 0) }}% growth
            </p>
          </div>
        </div>
      </section>

      <!-- Main Content Area -->
      <div class="dashboard-content">
        <!-- Tool Performance Table -->
        <section class="tool-performance">
          <div class="section-header">
            <h2><i class="fas fa-table"></i> Tool Performance Metrics</h2>
            <div class="table-controls">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search tools..."
                  class="search-input"
                >
              </div>
              <button class="refresh-btn" @click="fetchData" :disabled="loading">
                <i class="fas fa-redo" :class="{ 'fa-spin': loading }"></i> Refresh
              </button>
              <button class="export-btn" @click="exportData">
                <i class="fas fa-download"></i> Export
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="tools-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')" :class="{ sorted: sortColumn === 'name' }">
                    Tool Name <i :class="sortIcon('name')"></i>
                  </th>
                  <th @click="sortBy('usageCount')" :class="{ sorted: sortColumn === 'usageCount' }">
                    Times Used <i :class="sortIcon('usageCount')"></i>
                  </th>
                  <th @click="sortBy('avgTime')" :class="{ sorted: sortColumn === 'avgTime' }">
                    Avg. Time (s) <i :class="sortIcon('avgTime')"></i>
                  </th>
                  <th @click="sortBy('successRate')" :class="{ sorted: sortColumn === 'successRate' }">
                    Success Rate <i :class="sortIcon('successRate')"></i>
                  </th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tool in filteredTools" :key="tool.id">
                   <td class="tool-name">
    <i :class="tool.icon"></i>
    <div class="tool-name-content">
      <span>{{ tool.name }}</span>
      <small class="tool-original-name" v-if="tool.originalName && tool.originalName !== tool.name.toLowerCase().replace(/ /g, '_')">
        {{ tool.originalName }}
      </small>
    </div>
  </td>
                  <td>
                    <div class="metric-with-bar">
                      <span>{{ formatNumber(tool.usageCount) }}</span>
                      <div class="usage-bar">
                        <div 
                          class="bar-fill" 
                          :style="{ width: calculateUsagePercentage(tool.usageCount) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="time-metric" :class="getTimeClass(parseFloat(tool.avgTime))">
                      {{ tool.avgTime }}s
                    </span>
                  </td>
                  <td>
                    <div class="success-rate-display">
                      <span class="rate-value">{{ tool.successRate }}%</span>
                      <div class="rate-bar">
                        <div 
                          class="rate-fill" 
                          :style="{ 
                            width: tool.successRate + '%', 
                            backgroundColor: getSuccessColor(parseFloat(tool.successRate))
                          }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="category-badge" :class="tool.category">
                      {{ getCategoryName(tool.category) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="filteredTools.length === 0" class="empty-state">
              <i class="fas fa-search"></i>
              <p>No tools found matching "{{ searchQuery }}"</p>
            </div>
          </div>
        </section>

        <!-- Charts Section -->
        <section class="charts-section">
          <div class="chart-row">
            <!-- Usage Distribution Chart -->
            <div class="chart-container">
              <div class="chart-header">
                <h3><i class="fas fa-chart-pie"></i> Tool Usage Distribution</h3>
                <div class="chart-legend">
                  <span class="legend-item"><span class="legend-color pdf"></span>PDF Tools</span>
                  <span class="legend-item"><span class="legend-color image"></span>Image Tools</span>
                  <span class="legend-item"><span class="legend-color developer"></span>Developer Tools</span>
                </div>
              </div>
              <div class="chart-wrapper">
                <canvas ref="usageChart"></canvas>
              </div>
            </div>

            <!-- Success Rate Over Time -->
            <div class="chart-container">
              <div class="chart-header">
                <h3><i class="fas fa-chart-line"></i> Success Rate Trend</h3>
                <select v-model="selectedTimeframe" class="timeframe-select" @change="onTimeframeChange">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
              <div class="chart-wrapper">
                <canvas ref="successChart"></canvas>
              </div>
              <div class="chart-footer">
                <div class="trend-indicator" :class="getTrendClass()">
                  <i :class="getTrendIcon()"></i>
                  {{ getTrendText() }}
                </div>
              </div>
            </div>
          </div>

          <div class="chart-row">
            <!-- User Growth Chart -->
            <div class="chart-container full-width">
              <div class="chart-header">
                <h3><i class="fas fa-user-chart"></i> User Growth & Activity</h3>
                <div class="growth-stats">
                  <span class="growth-stat">
                    Monthly Growth: <strong>{{ dashboardStats.summary?.userGrowthPercent || 0 }}%</strong>
                  </span>
                  <span class="growth-stat">
                    Active Users: <strong>{{ formatNumber(dashboardStats.summary?.uniqueUsers || 0) }}</strong>
                  </span>
                  <span class="growth-stat">
                    New Users: <strong>{{ formatNumber(dashboardStats.summary?.newUsers || 0) }}</strong>
                  </span>
                </div>
              </div>
              <div class="chart-wrapper">
                <canvas ref="growthChart"></canvas>
              </div>
            </div>
          </div>
        </section>

        <!-- Additional Metrics -->
        <section class="additional-metrics">
          <div class="section-header">
            <h2><i class="fas fa-chart-bar"></i> Additional Insights</h2>
            <div class="view-toggle">
              <button 
                class="view-btn" 
                :class="{ active: viewMode === 'devices' }"
                @click="viewMode = 'devices'"
              >
                Devices
              </button>
              <button 
                class="view-btn" 
                :class="{ active: viewMode === 'countries' }"
                @click="viewMode = 'countries'"
              >
                Countries
              </button>
              <button 
                class="view-btn" 
                :class="{ active: viewMode === 'peak' }"
                @click="viewMode = 'peak'"
              >
                Peak Times
              </button>
            </div>
          </div>

          <div class="metrics-grid">
            <!-- Devices View -->
            <div v-if="viewMode === 'devices'" class="metric-box devices-view">
              <h4><i class="fas fa-mobile-alt"></i> Device Usage Distribution</h4>
              <div class="device-stats">
                <div v-for="device in deviceStats" :key="device.type" class="device-stat">
                  <div class="device-info">
                    <div class="device-header">
                      <span class="device-label">{{ formatDeviceName(device.type) }}</span>
                      <span class="device-percent">{{ device.percentage }}%</span>
                    </div>
                    <div class="device-bar">
                      <div 
                        class="device-bar-fill" 
                        :style="{ width: device.percentage + '%' }"
                      ></div>
                    </div>
                    <div class="device-count">{{ formatNumber(device.count) }} uses</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Countries View -->
            <div v-else-if="viewMode === 'countries'" class="metric-box countries-view">
              <h4><i class="fas fa-globe-americas"></i> Top Countries by Usage</h4>
              <div class="countries-list">
                <div v-for="(country, index) in countryStats" :key="country.code" class="country-item">
                  <div class="country-rank">{{ index + 1 }}</div>
                  <div class="country-flag">
                    <i :class="`fi fi-${country.code}`"></i>
                  </div>
                  <div class="country-info">
                    <div class="country-name">{{ country.name }}</div>
                    <div class="country-usage">{{ country.usage }}% of total</div>
                  </div>
                  <div class="country-bar">
                    <div 
                      class="country-bar-fill" 
                      :style="{ width: country.usage + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Peak Times View -->
            <div v-else class="metric-box peak-times-view">
              <h4><i class="fas fa-clock"></i> Peak Usage Patterns</h4>
              <div class="peak-times">
                <div class="peak-time">
                  <div class="peak-label">
                    <i class="fas fa-calendar-day"></i>
                    <span>Daily Peak Hours</span>
                  </div>
                  <div class="peak-value">{{ getPeakHours() }}</div>
                  <div class="peak-chart">
                    <div class="hourly-chart">
                      <div 
                        v-for="(count, hour) in dashboardStats.hourlyUsage || []" 
                        :key="hour"
                        class="hour-bar"
                        :style="{ height: calculateHourHeight(count) + '%' }"
                        :title="`${hour}:00 - ${count} uses`"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="peak-time">
                  <div class="peak-label">
                    <i class="fas fa-calendar-week"></i>
                    <span>Busiest Day</span>
                  </div>
                  <div class="peak-value">{{ getBusiestDay() }}</div>
                  <div class="peak-description">
                    Highest traffic day based on last 30 days
                  </div>
                </div>
                <div class="peak-time">
                  <div class="peak-label">
                    <i class="fas fa-chart-area"></i>
                    <span>Usage Pattern</span>
                  </div>
                  <div class="peak-value">{{ getUsagePattern() }}</div>
                  <div class="peak-description">
                    {{ getPatternDescription() }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="recent-activity">
          <h2><i class="fas fa-history"></i> Recent Activity</h2>
          <div class="activity-list">
            <div class="activity-item" v-for="activity in recentActivity" :key="activity.id">
              <div class="activity-details">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-meta">
                  <span class="activity-time">{{ activity.time }}</span>
                  <span class="activity-user">{{ activity.user }}</span>
                </div>
              </div>
              <div class="activity-status" :class="activity.status">
                {{ activity.status }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Settings Panel - REMOVED AUTO-REFRESH OPTION -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-header">
        <h3><i class="fas fa-cog"></i> Dashboard Settings</h3>
        <button class="close-settings" @click="showSettings = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="settings-content">
        <!-- Removed auto-refresh checkbox -->
        <div class="setting-item">
          <label>Time Format</label>
          <select v-model="timeFormat" class="setting-select">
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Number Format</label>
          <select v-model="numberFormat" class="setting-select">
            <option value="short">Short (1K, 1M)</option>
            <option value="long">Long (1,000)</option>
          </select>
        </div>
        <div class="setting-item">
          <label>Default Timeframe</label>
          <select v-model="selectedTimeframe" class="setting-select">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import Chart from 'chart.js/auto';
import axios from 'axios';

export default {
  name: 'AnalyticsDashboard',
  setup() {
    // Data properties
    const toolsData = ref([]);
    const dashboardStats = ref({});
    const usageTrends = ref({ labels: [], usage: [], success: [] });
    const userGrowth = ref({ months: [], newUsers: [], totalUses: [] });
    const deviceStats = ref([]);
    const countryStats = ref([]);
    
    // UI state
    const sortColumn = ref('usageCount');
    const sortDirection = ref('desc');
    const selectedTimeframe = ref('30d');
    const searchQuery = ref('');
    const viewMode = ref('devices');
    const loading = ref(true);
    const error = ref(null);
    const lastUpdated = ref(new Date());
    const showSettings = ref(false);
    const timeFormat = ref('12h');
    const numberFormat = ref('short');
    
    // Chart refs
    const usageChart = ref(null);
    const successChart = ref(null);
    const growthChart = ref(null);
    
    // Chart instances
    let usageChartInstance = null;
    let successChartInstance = null;
    let growthChartInstance = null;
    
    // Computed properties
    const sortedTools = computed(() => {
      const sorted = [...toolsData.value];
      sorted.sort((a, b) => {
        let aVal = a[sortColumn.value];
        let bVal = b[sortColumn.value];
        
        if (sortColumn.value === 'name') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
      });
      
      return sorted;
    });
    
    const filteredTools = computed(() => {
      if (!searchQuery.value.trim()) return sortedTools.value;
      
      const query = searchQuery.value.toLowerCase();
      return sortedTools.value.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
      );
    });
    
    const recentActivity = computed(() => {
      // Generate mock recent activity based on current data
      const activities = [];
      const tools = [...toolsData.value].sort(() => Math.random() - 0.5).slice(0, 5);
      
      tools.forEach((tool, index) => {
        const timeAgo = [
          '2 minutes ago',
          '15 minutes ago',
          '1 hour ago',
          '3 hours ago',
          'Today at 9:30 AM'
        ][index];
        
        activities.push({
          id: index + 1,
          title: `${tool.name} used`,
          time: timeAgo,
          user: `User ${Math.floor(Math.random() * 1000) + 1}`,
          icon: tool.icon,
          type: tool.category,
          status: parseFloat(tool.successRate) > 95 ? 'success' : 'warning'
        });
      });
      
      return activities;
    });
    
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    console.log('🔄 Fetching analytics data...');
    
    // Make all necessary API calls in parallel
    const [dashboardResponse, toolsResponse, trendsResponse, growthResponse, deviceCountryResponse] = await Promise.all([
      axios.get('http://192.168.18.101:3000/api/analytics/dashboard'),
      axios.get('http://192.168.18.101:3000/api/analytics/tools/performance'),
      axios.get(`http://192.168.18.101:3000/api/analytics/trends/usage?timeframe=${selectedTimeframe.value}`),
      axios.get('http://192.168.18.101:3000/api/analytics/trends/users'),
      axios.get('http://192.168.18.101:3000/api/analytics/stats/devices-countries')
    ]);
    
    // Set all data
    dashboardStats.value = dashboardResponse.data.data;
    toolsData.value = toolsResponse.data.tools || [];
    usageTrends.value = trendsResponse.data.data;
    userGrowth.value = growthResponse.data.data;
    
    // IMPORTANT: Extract device and country stats from deviceCountryResponse
    if (deviceCountryResponse.data.data) {
      deviceStats.value = deviceCountryResponse.data.data.devices || [];
      countryStats.value = deviceCountryResponse.data.data.countries || [];
    }
    
    lastUpdated.value = new Date();
    initCharts();
    console.log('✅ Analytics data fetched successfully');
    
  } catch (err) {
    console.error('❌ Error fetching analytics data:', err);
    error.value = err.response?.data?.error || 'Failed to load analytics data.';
  } finally {
    loading.value = false;
  }
};
    
    const initCharts = () => {
      // Destroy existing charts
      [usageChartInstance, successChartInstance, growthChartInstance].forEach(chart => {
        if (chart) chart.destroy();
      });
      
      // Usage Distribution Chart
      if (usageChart.value && toolsData.value.length > 0) {
        const usageCtx = usageChart.value.getContext('2d');
        
        // Calculate category totals
        const categories = ['pdf', 'image', 'developer', 'video', 'other'];
        const categoryNames = ['PDF Tools', 'Image Tools', 'Developer Tools', 'Video Tools', 'Other Tools'];
        const categoryColors = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];
        
        const categoryData = categories.map(category => 
          toolsData.value.filter(t => t.category === category).reduce((sum, t) => sum + t.usageCount, 0)
        );
        
        usageChartInstance = new Chart(usageCtx, {
          type: 'doughnut',
          data: {
            labels: categoryNames,
            datasets: [{
              data: categoryData,
              backgroundColor: categoryColors,
              borderWidth: 2,
              borderColor: '#1f2937'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    const total = categoryData.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${formatNumber(value)} (${percentage}%)`;
                  }
                }
              }
            },
            cutout: '70%'
          }
        });
      }
      
      // Success Rate Chart
      if (successChart.value && usageTrends.value.labels && usageTrends.value.success.length > 0) {
        const successCtx = successChart.value.getContext('2d');
        
        successChartInstance = new Chart(successCtx, {
          type: 'line',
          data: {
            labels: usageTrends.value.labels,
            datasets: [{
              label: 'Success Rate',
              data: usageTrends.value.success,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `Success Rate: ${context.raw}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 85,
                max: 100,
                ticks: { 
                  callback: value => value + '%',
                  color: '#94a3b8'
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              }
            }
          }
        });
      }
      
      // User Growth Chart
      if (growthChart.value && userGrowth.value.months && userGrowth.value.newUsers.length > 0) {
        const growthCtx = growthChart.value.getContext('2d');
        
        growthChartInstance = new Chart(growthCtx, {
          type: 'bar',
          data: {
            labels: userGrowth.value.months,
            datasets: [{
              label: 'New Users',
              data: userGrowth.value.newUsers,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 4,
              borderSkipped: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `New Users: ${formatNumber(context.raw)}`;
                  }
                }
              }
            },
            scales: {
              y: { 
                beginAtZero: true,
                ticks: { 
                  callback: value => formatNumber(value),
                  color: '#94a3b8'
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' }
              }
            }
          }
        });
      }
    };
    
    const formatNumber = (num) => {
      if (!num && num !== 0) return '0';
      num = parseInt(num);
      
      if (numberFormat.value === 'long') {
        return num.toLocaleString();
      }
      
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    };
    
    const formatDate = (date) => {
      if (!(date instanceof Date)) date = new Date(date);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: timeFormat.value === '12h'
      });
    };
    
    const calculateUsagePercentage = (usageCount) => {
      if (toolsData.value.length === 0) return 0;
      const maxUsage = Math.max(...toolsData.value.map(tool => tool.usageCount));
      return maxUsage > 0 ? (usageCount / maxUsage) * 100 : 0;
    };
    
    const getTimeClass = (time) => {
      if (time < 2.5) return 'fast';
      if (time < 5) return 'medium';
      return 'slow';
    };
    
    const getSuccessColor = (rate) => {
      if (rate >= 98) return '#10b981';
      if (rate >= 95) return '#f59e0b';
      return '#ef4444';
    };
    
    const getCategoryName = (category) => {
      const names = {
        'pdf': 'PDF',
        'image': 'Image',
        'developer': 'Dev',
        'video': 'Video',
        'other': 'Other'
      };
      return names[category] || category;
    };
    
    const sortBy = (column) => {
      if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn.value = column;
        sortDirection.value = 'desc';
      }
    };
    
    const sortIcon = (column) => {
      if (sortColumn.value !== column) return 'fas fa-sort';
      return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    };
    
    const exportData = () => {
      const data = {
        dashboardStats: dashboardStats.value,
        tools: toolsData.value,
        lastUpdated: lastUpdated.value
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    const onTimeframeChange = () => {
      fetchData();
    };
    
    const getTrendClass = () => {
      if (usageTrends.value.success.length < 2) return 'neutral';
      const first = parseFloat(usageTrends.value.success[0]);
      const last = parseFloat(usageTrends.value.success[usageTrends.value.success.length - 1]);
      return last > first ? 'positive' : last < first ? 'negative' : 'neutral';
    };
    
    const getTrendIcon = () => {
      const trend = getTrendClass();
      return trend === 'positive' ? 'fas fa-arrow-up' : 
             trend === 'negative' ? 'fas fa-arrow-down' : 
             'fas fa-minus';
    };
    
    const getTrendText = () => {
      if (usageTrends.value.success.length < 2) return 'No trend data';
      const first = parseFloat(usageTrends.value.success[0]);
      const last = parseFloat(usageTrends.value.success[usageTrends.value.success.length - 1]);
      const diff = ((last - first) / first * 100).toFixed(1);
      return diff >= 0 ? `Up ${Math.abs(diff)}%` : `Down ${Math.abs(diff)}%`;
    };
    
    const getDeviceIcon = (deviceType) => {
      const icons = {
        'desktop': 'fas fa-desktop',
        'mobile': 'fas fa-mobile-alt',
        'tablet': 'fas fa-tablet-alt',
        'unknown': 'fas fa-question-circle'
      };
      return icons[deviceType] || 'fas fa-laptop';
    };
    
    const formatDeviceName = (deviceType) => {
      return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
    };
    
    const getPeakHours = () => {
      if (!dashboardStats.value.hourlyUsage || dashboardStats.value.hourlyUsage.length === 0) {
        return timeFormat.value === '12h' ? '2:00 PM - 4:00 PM' : '14:00 - 16:00';
      }
      
      const hourly = dashboardStats.value.hourlyUsage;
      let maxCount = 0;
      let peakHour = 14;
      
      for (let i = 0; i < hourly.length; i++) {
        if (hourly[i] > maxCount) {
          maxCount = hourly[i];
          peakHour = i;
        }
      }
      
      const formatHour = (hour) => {
        if (timeFormat.value === '12h') {
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:00 ${period}`;
        }
        return `${hour}:00`;
      };
      
      const startHour = peakHour;
      const endHour = (peakHour + 2) % 24;
      return `${formatHour(startHour)} - ${formatHour(endHour)}`;
    };
    
    const getBusiestDay = () => {
      if (!dashboardStats.value.dailyTrends || dashboardStats.value.dailyTrends.length === 0) {
        return 'Tuesday';
      }
      
      const days = dashboardStats.value.dailyTrends;
      let maxCount = 0;
      let busiestDay = 'Tuesday';
      
      days.forEach(day => {
        if (day.count > maxCount) {
          maxCount = day.count;
          busiestDay = day.day;
        }
      });
      
      return busiestDay;
    };
    
    const getUsagePattern = () => {
      // Analyze hourly usage pattern
      if (!dashboardStats.value.hourlyUsage) return 'Standard';
      
      const morning = dashboardStats.value.hourlyUsage.slice(9, 12).reduce((a, b) => a + b, 0);
      const afternoon = dashboardStats.value.hourlyUsage.slice(13, 17).reduce((a, b) => a + b, 0);
      const evening = dashboardStats.value.hourlyUsage.slice(18, 22).reduce((a, b) => a + b, 0);
      
      if (afternoon > morning && afternoon > evening) return 'Afternoon Peak';
      if (morning > afternoon && morning > evening) return 'Morning Focus';
      if (evening > morning && evening > afternoon) return 'Evening Usage';
      return 'Balanced';
    };
    
    const getPatternDescription = () => {
      const pattern = getUsagePattern();
      const descriptions = {
        'Afternoon Peak': 'Highest activity during afternoon hours',
        'Morning Focus': 'Peak usage in morning, declines through day',
        'Evening Usage': 'Most activity in evening hours',
        'Balanced': 'Consistent usage throughout the day',
        'Standard': 'Following typical daily patterns'
      };
      return descriptions[pattern] || 'Standard daily pattern';
    };
    
    const calculateHourHeight = (count) => {
      if (!dashboardStats.value.hourlyUsage || dashboardStats.value.hourlyUsage.length === 0) return 50;
      const maxCount = Math.max(...dashboardStats.value.hourlyUsage);
      return maxCount > 0 ? (count / maxCount) * 100 : 0;
    };
    
    const toggleSettings = () => {
      showSettings.value = !showSettings.value;
    };
    
    // Lifecycle
    onMounted(() => {
      fetchData();
      
      onUnmounted(() => {
        // Clean up chart instances
        [usageChartInstance, successChartInstance, growthChartInstance].forEach(chart => {
          if (chart) chart.destroy();
        });
      });
    });
    
    return {
      // Data
      toolsData,
      dashboardStats,
      usageTrends,
      userGrowth,
      deviceStats,
      countryStats,
      recentActivity,
      
      // UI State
      sortColumn,
      sortDirection,
      selectedTimeframe,
      searchQuery,
      viewMode,
      loading,
      error,
      lastUpdated,
      showSettings,
      timeFormat,
      numberFormat,
      
      // Chart Refs
      usageChart,
      successChart,
      growthChart,
      
      // Methods
      formatNumber,
      formatDate,
      calculateUsagePercentage,
      getTimeClass,
      getSuccessColor,
      getCategoryName,
      sortBy,
      sortIcon,
      fetchData,
      exportData,
      onTimeframeChange,
      getTrendClass,
      getTrendIcon,
      getTrendText,
      getDeviceIcon,
      formatDeviceName,
      getPeakHours,
      getBusiestDay,
      getUsagePattern,
      getPatternDescription,
      calculateHourHeight,
      toggleSettings,
      
      // Computed
      sortedTools,
      filteredTools
    };
  }
};
</script>
<style scoped>
.analytics-dashboard {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  border-radius: 20px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
}

.loading-state .spinner {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 20px;
}

.loading-state p {
  color: #94a3b8;
  font-size: 1.1rem;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 40px;
}

.error-state .error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 20px;
}

.error-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #f8fafc;
  font-weight: 400;
}

.error-state p {
  color: #94a3b8;
  margin-bottom: 30px;
  max-width: 400px;
}

.retry-btn {
  background: black;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #2563eb;
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Header */
.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 10px;
  color: #f8fafc;
  align-items: center;
  gap: 15px;
}

.dashboard-header h1 i {
  color: #3b82f6;
}

.subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.8);
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid #334155;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.last-updated {
  display: flex;
  align-items: center;
  gap: 10px;
}

.last-updated i {
  color: #3b82f6;
}

.auto-refresh-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
}

.data-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.data-range i {
  color: #8b5cf6;
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #334155;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  border-color: #475569;
}

.stat-card.avg-time::before { background: linear-gradient(90deg, #10b981, #3b82f6); }
.stat-card.success-rate::before { background: linear-gradient(90deg, #10b981, #22c55e); }
.stat-card.user-growth::before { background: linear-gradient(90deg, #8b5cf6, #ec4899); }

.stat-icon {
  width: 70px;
  height: 70px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-card.avg-time .stat-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.stat-card.success-rate .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
.stat-card.user-growth .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: white;
  margin-bottom: 8px;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 400;
  margin-bottom: 10px;
  color: #f8fafc;
}

.stat-change {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}

.stat-change.positive { color: #10b981; }
.stat-change.negative { color: #ef4444; }

.success-details, .user-details {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 8px;
}

.success-count { color: #10b981; }
.failure-count { color: #ef4444; }
.new-users { color: #3b82f6; }
.total-uses { color: #8b5cf6; }

/* Dashboard Content */
.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 300;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
}

.section-header h2 i {
  color: #3b82f6;
}

/* Table Controls */
.table-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #475569;
  border-radius: 8px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: border-color 0.3s;
}

.search-box:focus-within {
  border-color: #3b82f6;
}

.search-box i {
  color: #94a3b8;
}

.search-input {
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.9rem;
  width: 200px;
  outline: none;
}

.search-input::placeholder {
  color: #64748b;
}

.refresh-btn, .export-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #475569;
  background: rgba(30, 41, 59, 0.8);
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.refresh-btn:hover:not(:disabled), .export-btn:hover {
  background: #334155;
  border-color: #64748b;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table */
.table-container {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 15px;
  overflow: hidden;
  border: 1px solid #334155;
}

.tools-table {
  width: 100%;
  border-collapse: collapse;
}

.tools-table thead {
  background: rgba(15, 23, 42, 0.95);
}

.tools-table th {
  padding: 20px 15px;
  text-align: left;
  font-weight: 400;
  color: #cbd5e1;
  border-bottom: 2px solid #334155;
  cursor: pointer;
  user-select: none;
  transition: background 0.3s;
  font-size: 0.9rem;
}

.tools-table th:hover {
  background: rgba(51, 65, 85, 0.5);
}

.tools-table th.sorted {
  color: #3b82f6;
}

.tools-table th i {
  margin-left: 8px;
  font-size: 0.8rem;
}

.tools-table tbody tr {
  border-bottom: 1px solid #334155;
  transition: background 0.3s;
}

.tools-table tbody tr:hover {
  background: rgba(51, 65, 85, 0.3);
}

.tools-table td {
  padding: 18px 15px;
}

.tool-name {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 400;
}

.tool-name i {
  font-size: 1.2rem;
  color: #3b82f6;
  width: 24px;
  text-align: center;
}

.metric-with-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.usage-bar {
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.time-metric {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 400;
  font-size: 0.9rem;
  display: inline-block;
}

.time-metric.fast { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.time-metric.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.time-metric.slow { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.success-rate-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rate-value {
  min-width: 50px;
  font-weight: 400;
  font-size: 0.9rem;
}

.rate-bar {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.category-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-badge.pdf { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.category-badge.image { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.category-badge.developer { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.category-badge.video { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.category-badge.other { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #475569;
}

.empty-state p {
  font-size: 1.1rem;
}

/* Charts Section */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

.chart-container {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
}

.chart-container.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.chart-header h3 {
  font-size: 1.2rem;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #f8fafc;
}

.chart-header h3 i {
  color: #3b82f6;
}

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #94a3b8;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.pdf { background: #3b82f6; }
.legend-color.image { background: #10b981; }
.legend-color.developer { background: #8b5cf6; }
.legend-color.video { background: #ef4444; }
.legend-color.other { background: #f59e0b; }

.timeframe-select {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #475569;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

.timeframe-select:hover {
  border-color: #64748b;
}

.chart-wrapper {
  height: 250px;
  position: relative;
  flex: 1;
}

.chart-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #334155;
}

.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 400;
}

.trend-indicator.positive {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.trend-indicator.negative {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.trend-indicator.neutral {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.growth-stats {
  display: flex;
  gap: 25px;
}

.growth-stat {
  color: #94a3b8;
  font-size: 0.9rem;
}

.growth-stat strong {
  color: #f8fafc;
  font-weight: 400;
}

/* Additional Metrics */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.metric-box {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 15px;
  padding: 25px;
  border: 1px solid #334155;
}

.metric-box h4 {
  font-size: 1.1rem;
  font-weight: 400;
  margin-bottom: 25px;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
}

.metric-box h4 i {
  color: #3b82f6;
}

.device-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-stat {
  display: flex;
  align-items: center;
  gap: 20px;
}

.device-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.device-info {
  flex: 1;
}

.device-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.device-label {
  color: #f8fafc;
  font-weight: 300;
}

.device-percent {
  font-weight: 400;
  color: white;
}

.device-bar {
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
}

.device-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.device-count {
  font-size: 0.85rem;
  color: #94a3b8;
}

.countries-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.country-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(51, 65, 85, 0.3);
  transition: background 0.3s;
}

.country-item:hover {
  background: rgba(51, 65, 85, 0.5);
}

.country-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.9rem;
}

.country-flag {
  font-size: 1.5rem;
}

.country-info {
  flex: 1;
}

.country-name {
  font-weight: 400;
  color: #f8fafc;
  margin-bottom: 4px;
}

.country-usage {
  font-size: 0.85rem;
  color: #94a3b8;
}

.country-bar {
  flex: 1;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
  max-width: 200px;
}

.country-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 3px;
  transition: width 0.5s ease;
}

/* Peak Times View */
.peak-times {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
}

.peak-time {
  background: rgba(51, 65, 85, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.peak-label {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.peak-label i {
  color: #3b82f6;
  font-size: 1.2rem;
}

.peak-label span {
  font-weight: 400;
  color: #f8fafc;
}

.peak-value {
  font-size: 1.5rem;
  font-weight: 300;
  color: white;
  margin-bottom: 10px;
}

.peak-description {
  font-size: 0.9rem;
  color: #94a3b8;
  line-height: 1.5;
}

.hourly-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 100px;
  margin-top: 15px;
}

.hour-bar {
  flex: 1;
  background: linear-gradient(to top, #3b82f6, #8b5cf6);
  border-radius: 3px 3px 0 0;
  min-height: 1px;
  transition: height 0.3s ease;
}

.hour-bar:hover {
  opacity: 0.8;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 8px;
  background: rgba(30, 41, 59, 0.8);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid #334155;
}

.view-btn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.tool-name-content {
  display: flex;
  flex-direction: column;
}

.tool-original-name {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 2px;
  font-family: monospace;
  opacity: 0.7;
}

.view-btn.active {
  background: white;
  color: black;
}

.view-btn:hover:not(.active) {
  background: rgba(51, 65, 85, 0.5);
  color: #f8fafc;
}

/* Recent Activity */
.recent-activity h2 {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
}

.recent-activity h2 i {
  color: #3b82f6;
}

.activity-list {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 15px;
  border: 1px solid #334155;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #334155;
  transition: background 0.3s;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: rgba(51, 65, 85, 0.3);
}

.activity-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.activity-icon.pdf { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.activity-icon.image { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.activity-icon.developer { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; }
.activity-icon.video { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

.activity-details {
  flex: 1;
}

.activity-title {
  font-weight: 300;
  color: #f8fafc;
  margin-bottom: 5px;
}

.activity-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #94a3b8;
}

.activity-status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 400;
  text-transform: uppercase;
}

.activity-status.success {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.activity-status.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.activity-status.error {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Settings Panel */
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 350px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid #334155;
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.settings-panel[style*="display: block"] {
  transform: translateX(0);
}

.settings-header {
  padding: 25px;
  border-bottom: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  font-size: 1.2rem;
  font-weight: 400;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-settings {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: color 0.3s;
}

.close-settings:hover {
  color: #f8fafc;
}

.settings-content {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
}

.setting-item {
  margin-bottom: 25px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: #f8fafc;
  font-weight: 300;
}

.setting-select {
  width: 100%;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #475569;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.3s;
}

.setting-select:hover {
  border-color: #64748b;
}

.setting-item input[type="checkbox"] {
  margin-right: 10px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 15px;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .table-controls {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .search-input {
    width: 150px;
  }
  
  .header-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .peak-times {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-header h1 {
    font-size: 1.7rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .stat-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .refresh-btn, .export-btn {
    justify-content: center;
  }
  
  .activity-item {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .activity-details {
    text-align: center;
  }
  
  .activity-meta {
    justify-content: center;
  }
  
  .fab-container {
    bottom: 20px;
    right: 20px;
  }
  
  .fab {
    width: 50px;
    height: 50px;
    font-size: 1.3rem;
  }
}
</style>