# 🚀 Chat Service Load Testing (Spec v4.0.1)

Tài liệu này hướng dẫn cách chạy kiểm thử tải để đảm bảo hệ thống chịu được **100 người dùng đồng thời** với độ trễ thấp.

## 🎯 Chỉ số mục tiêu (KPIs)

- **100 Concurrent Users**: Giả lập 100 người dùng chat cùng lúc.
- **P95 WebSocket Latency**: < 100ms.
- **P95 API Response Time**: < 300ms.
- **Error Rate**: 0%.

## 📋 Bước 1: Chuẩn bị dữ liệu

Thay vì chạy SQL thủ công, hãy sử dụng script đã chuẩn bị sẵn trong thư mục `scripts/`:

```powershell
# Chạy từ thư mục gốc của dự án
node scripts/prepare-test-data.js
```
