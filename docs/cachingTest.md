# Dirhamy: Performance & Security Audit Report

## 1. Performance Profiling (Cache Evaluation)

To ensure Dirhamy can handle high traffic while maintaining snappy response times, we conducted load testing against the `/transactions/user` endpoint. We measured the system's performance both with and without the Redis caching layer enabled.

### Test Parameters
- **Concurrency**: 10 simultaneous workers
- **Requests per worker**: 20
- **Total Requests per test**: 200

### Results Comparison

| Metric | Without Cache (Direct DB) | With Redis Cache | Improvement |
| :--- | :--- | :--- | :--- |
| **Average Latency** | 97.05 ms | 35.73 ms | **↓ 63.1% Faster** |
| **Throughput (Req/sec)** | 92.34 rps | 233.37 rps | **↑ 152.7% More Capacity** |
| **Error Rate** | 0% | 0% | Stable |

### Conclusion
The implementation of the `cacheWithDependencies` Redis middleware is a massive success. It **more than doubles the server's throughput capacity** while **cutting response times by nearly two-thirds**. This actively protects the PostgreSQL database from redundant queries and ensures the end-user dashboard loads instantly.


