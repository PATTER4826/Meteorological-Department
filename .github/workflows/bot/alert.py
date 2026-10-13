
import os
import requests
from datetime import datetime
from zoneinfo import ZoneInfo

TOKEN = os.environ["DISCORD_BOT_TOKEN"]
CHANNEL_ID = os.environ["DISCORD_CHANNEL_ID"]

# พิกัดเริ่มต้น: กรุงเทพฯ
LATITUDE = 13.7563
LONGITUDE = 100.5018

def main():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "current": (
            "temperature_2m,relative_humidity_2m,"
            "apparent_temperature,is_day,precipitation,"
            "weather_code,wind_speed_10m"
        ),
        "timezone": "Asia/Bangkok",
    }

    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    data = response.json()["current"]

    code = data["weather_code"]
    descriptions = {
        0: "ท้องฟ้าแจ่มใส",
        1: "ท้องฟ้าโปร่งเป็นส่วนใหญ่",
        2: "มีเมฆบางส่วน",
        3: "มีเมฆมาก",
        45: "มีหมอก",
        48: "มีหมอกจับตัวเป็นน้ำแข็ง",
        51: "ฝนปรอยเล็กน้อย",
        53: "ฝนปรอยปานกลาง",
        55: "ฝนปรอยหนาแน่น",
        61: "ฝนตกเล็กน้อย",
        63: "ฝนตกปานกลาง",
        65: "ฝนตกหนัก",
        71: "หิมะตกเล็กน้อย",
        73: "หิมะตกปานกลาง",
        75: "หิมะตกหนัก",
        80: "มีฝนซู่เล็กน้อย",
        81: "มีฝนซู่ปานกลาง",
        82: "มีฝนซู่หนัก",
        95: "มีพายุฝนฟ้าคะนอง",
        96: "พายุฝนฟ้าคะนองและลูกเห็บ",
        99: "พายุฝนฟ้าคะนองและลูกเห็บหนัก",
    }
    weather = descriptions.get(code, "สภาพอากาศแปรปรวน")

    now = datetime.now(ZoneInfo("Asia/Bangkok"))
    message = (
        "🌦️ **รายงานสภาพอากาศ**\n"
        f"📍 กรุงเทพฯ\n"
        f"🕒 {now:%d/%m/%Y %H:%M} น.\n"
        f"🌤️ สภาพอากาศ: {weather}\n"
        f"🌡️ อุณหภูมิ: {data['temperature_2m']}°C\n"
        f"🤒 อุณหภูมิที่รู้สึก: {data['apparent_temperature']}°C\n"
        f"💧 ความชื้น: {data['relative_humidity_2m']}%\n"
        f"🌧️ ปริมาณฝนขณะนี้: {data['precipitation']} มม.\n"
        f"💨 ลม: {data['wind_speed_10m']} กม./ชม."
    )

    discord_url = (
        f"https://discord.com/api/v10/channels/"
        f"{CHANNEL_ID}/messages"
    )
    result = requests.post(
        discord_url,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
        },
        json={"content": message},
        timeout=20,
    )
    result.raise_for_status()
    print("ส่งรายงานสภาพอากาศเข้า Discord สำเร็จ")

if __name__ == "__main__":
    main()
  
