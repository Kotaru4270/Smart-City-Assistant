const axios  = require('axios');
const { Notification } = require('../models/LoginHistory');
const User   = require('../models/User');

const broadcastWeatherAlerts = async (io) => {
  try {
    const users = await User.find({ isActive: true, 'preferences.preferredCity': { $ne: '' } })
      .select('_id preferences');

    const cities = [...new Set(users.map((u) => u.preferences.preferredCity).filter(Boolean))];

    for (const city of cities) {
      try {
        const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
        const alertsRes = await axios.get(`${BASE}/ai/alerts?city=${encodeURIComponent(city)}`);
        const { alerts } = alertsRes.data;

        if (!alerts?.length) continue;

        const cityUsers = users.filter((u) => u.preferences.preferredCity === city);

        for (const alert of alerts.filter((a) => a.type === 'danger' || a.type === 'warning')) {
          const notifications = cityUsers.map((u) => ({
            user:     u._id,
            type:     alert.type === 'danger' ? 'aqi_alert' : 'weather_alert',
            title:    alert.title,
            message:  alert.message,
            severity: alert.type,
            city,
          }));

          await Notification.insertMany(notifications, { ordered: false });

          // Emit via Socket.IO
          cityUsers.forEach((u) => {
            io.to(`user:${u._id}`).emit('notification', {
              title: alert.title,
              message: alert.message,
              severity: alert.type,
            });
          });
        }
      } catch (e) {
        console.error(`Alert error for ${city}:`, e.message);
      }
    }
  } catch (err) {
    console.error('broadcastWeatherAlerts error:', err.message);
  }
};

module.exports = { broadcastWeatherAlerts };
