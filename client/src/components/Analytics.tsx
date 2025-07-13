import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

interface DashboardData {
  totalEarnings: number;
  totalAdReads: number;
  totalConversations: number;
  productStats: Array<{
    name: string;
    pay_per_mention: number;
    mentions: number;
    earnings: number;
  }>;
  dailyEarnings: Array<{
    date: string;
    earnings: number;
    ad_reads: number;
  }>;
}

const Analytics: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');
  const { token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="admin-section">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="admin-section">
        <div className="error">Failed to load analytics data.</div>
      </div>
    );
  }

  const COLORS = ['#6b46c1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  const preparedChartData = dashboardData.dailyEarnings.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })).reverse();

  const productChartData = dashboardData.productStats.filter(p => p.mentions > 0);

  return (
    <div className="admin-section">
      <h2>📊 Analytics Dashboard</h2>
      <p className="section-description">
        Track FriendBot's performance, earnings, and product placement effectiveness.
      </p>

      <div className="analytics-header">
        <div className="timeframe-selector">
          <label>Timeframe:</label>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Earnings</h3>
            <div className="stat-value">${dashboardData.totalEarnings.toFixed(2)}</div>
          </div>
        </div>

        <div className="stat-card ad-reads">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <h3>Total Ad Reads</h3>
            <div className="stat-value">{dashboardData.totalAdReads}</div>
          </div>
        </div>

        <div className="stat-card conversations">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>Total Conversations</h3>
            <div className="stat-value">{dashboardData.totalConversations}</div>
          </div>
        </div>

        <div className="stat-card avg-earning">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Avg. per Ad Read</h3>
            <div className="stat-value">
              ${dashboardData.totalAdReads > 0 
                ? (dashboardData.totalEarnings / dashboardData.totalAdReads).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {preparedChartData.length > 0 && (
        <div className="chart-section">
          <h3>📈 Daily Earnings Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={preparedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="earnings" orientation="left" />
                <YAxis yAxisId="reads" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'earnings' ? `$${value}` : value,
                    name === 'earnings' ? 'Earnings' : 'Ad Reads'
                  ]}
                />
                <Legend />
                <Line 
                  yAxisId="earnings"
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#6b46c1" 
                  strokeWidth={3}
                  name="earnings"
                />
                <Line 
                  yAxisId="reads"
                  type="monotone" 
                  dataKey="ad_reads" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="ad_reads"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {productChartData.length > 0 && (
        <div className="charts-row">
          <div className="chart-section">
            <h3>🎯 Product Performance (Mentions)</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mentions" fill="#6b46c1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-section">
            <h3>💵 Earnings by Product</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, earnings }) => `${name}: $${earnings}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="earnings"
                  >
                    {productChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="product-performance-table">
        <h3>📊 Detailed Product Performance</h3>
        {dashboardData.productStats.length > 0 ? (
          <table className="performance-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Pay per Mention</th>
                <th>Total Mentions</th>
                <th>Total Earnings</th>
                <th>Effectiveness</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.productStats
                .sort((a, b) => b.earnings - a.earnings)
                .map((product, index) => (
                <tr key={index}>
                  <td className="product-name">{product.name}</td>
                  <td className="pay-rate">${product.pay_per_mention}</td>
                  <td className="mentions">{product.mentions}</td>
                  <td className="earnings">${product.earnings || 0}</td>
                  <td className="effectiveness">
                    <div className={`effectiveness-badge ${
                      product.mentions >= 10 ? 'high' :
                      product.mentions >= 5 ? 'medium' : 'low'
                    }`}>
                      {product.mentions >= 10 ? '🔥 High' :
                       product.mentions >= 5 ? '📈 Medium' : '📉 Low'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No product performance data yet. Start adding products and have some conversations!</p>
          </div>
        )}
      </div>

      {dashboardData.totalEarnings === 0 && (
        <div className="getting-started">
          <h3>🚀 Getting Started</h3>
          <div className="tips">
            <div className="tip">
              <strong>1. Add Products:</strong> Go to the Products section and add some sponsored items.
            </div>
            <div className="tip">
              <strong>2. Set Character Prompt:</strong> Configure how aggressively FriendBot promotes products.
            </div>
            <div className="tip">
              <strong>3. Start Conversations:</strong> Have users chat with FriendBot to generate ad reads and earnings.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;