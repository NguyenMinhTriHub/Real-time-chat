import json
import os

def generate_report():
    if not os.path.exists('report.json'):
        print("❌ Không tìm thấy file report.json. Hãy chạy bài test trước.")
        return

    with open('report.json', 'r') as f:
        data = json.load(f)

    stats = data['aggregate']['summaries']['socketio.response_time']
    vusers = data['aggregate']['counters']

    print("\n" + "="*40)
    print("📊 BÁO CÁO KIỂM THỬ ÁP LỰC CHAT SERVICE")
    print("="*40)
    print(f"✅ Tổng User thành công: {vusers.get('vusers.completed', 0)}")
    print(f"❌ Tổng User thất bại:   {vusers.get('vusers.failed', 0)}")
    print("-" * 40)
    print(f"🚀 Độ trễ Trung bình: {stats['mean']:.2f} ms")
    print(f"🔥 Độ trễ P95 (95%):  {stats['p95']:.2f} ms")
    print(f"🐢 Độ trễ chậm nhất:   {stats['max']:.2f} ms")
    print("="*40 + "\n")

if __name__ == "__main__":
    generate_report()