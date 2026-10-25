const performanceStats = {
  requestCount: 0,
  totalLatency: 0,
  averageLatency: 0,
  latencyHistory: []
};

const performanceLogger = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = parseFloat(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));

    performanceStats.requestCount++;
    performanceStats.totalLatency += timeInMs;
    performanceStats.latencyHistory.push(timeInMs);
    
    // Keep history bounded to last 100 requests
    if (performanceStats.latencyHistory.length > 100) {
      const removed = performanceStats.latencyHistory.shift();
      performanceStats.totalLatency -= removed;
    }

    performanceStats.averageLatency = parseFloat(
      (performanceStats.totalLatency / performanceStats.latencyHistory.length).toFixed(2)
    );
  });

  next();
};

module.exports = {
  performanceLogger,
  performanceStats
};
