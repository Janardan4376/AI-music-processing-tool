import requests
import time
import os

BASE_URL = "http://localhost:5000/api"
EMAIL = "test@example.com"
PASSWORD = "password123"

def test_progress():
    # 1. Authenticate
    print("1. Authenticating...")
    session = requests.Session()
    try:
        res = session.post(f"{BASE_URL}/login", json={"email": EMAIL, "password": PASSWORD})
        if res.status_code != 200:
             # Try register
             res = session.post(f"{BASE_URL}/register", json={"email": EMAIL, "password": PASSWORD})
        
        if res.status_code != 200:
            print(f"Auth failed: {res.text}")
            return
            
        token = res.json()['token']
    except Exception as e:
        print(f"Auth error: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("   Authenticated.")

    # 2. Upload
    print("2. Uploading file...")
    dummy_file = "test_progress.wav"
    if not os.path.exists(dummy_file):
        with open(dummy_file, "wb") as f:
            f.write(os.urandom(1024 * 1024)) # 1MB
            
    with open(dummy_file, "rb") as f:
        files = {"file": (dummy_file, f, "audio/wav")}
        res = requests.post(f"{BASE_URL}/upload", headers=headers, files=files)
        if res.status_code != 200:
            print(f"Upload failed: {res.text}")
            return
        song_id = res.json()['song_id']
        print(f"   Upload successful. Song ID: {song_id}")

    # 3. Poll Progress
    print("3. Polling progress...")
    last_progress = -1
    for i in range(30):
        res = requests.get(f"{BASE_URL}/songs", headers=headers)
        songs = res.json()
        target_song = next((s for s in songs if s['id'] == song_id), None)
        
        if target_song:
            progress = target_song.get('progress', 0)
            status = target_song['status']
            
            if progress != last_progress:
                print(f"   Progress: {progress}% (Status: {status})")
                last_progress = progress
            
            if status == 'ready':
                print("   Processing complete!")
                break
            elif status == 'error':
                print("   Processing failed.")
                break
        
        time.sleep(1)

if __name__ == "__main__":
    test_progress()
