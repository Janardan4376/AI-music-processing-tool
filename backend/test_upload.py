import requests
import time
import os

BASE_URL = "http://localhost:5000/api"
EMAIL = "test@example.com"
PASSWORD = "password123"

def test_flow():
    # 1. Register/Login
    print("1. Authenticating...")
    session = requests.Session()
    try:
        res = session.post(f"{BASE_URL}/register", json={"email": EMAIL, "password": PASSWORD})
        if res.status_code == 200:
            token = res.json()['token']
        elif res.status_code == 400 and "already exists" in res.text:
            res = session.post(f"{BASE_URL}/login", json={"email": EMAIL, "password": PASSWORD})
            res.raise_for_status()
            token = res.json()['token']
        else:
            print(f"Auth failed: {res.text}")
            return
    except Exception as e:
        print(f"Auth error: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print("   Authenticated successfully.")

    # 2. Upload File
    print("2. Uploading file...")
    # Create a dummy wav file if not exists
    dummy_file = "test_audio.wav"
    if not os.path.exists(dummy_file):
        with open(dummy_file, "wb") as f:
            f.write(os.urandom(1024 * 1024)) # 1MB dummy file
    
    try:
        with open(dummy_file, "rb") as f:
            files = {"file": (dummy_file, f, "audio/wav")}
            res = requests.post(f"{BASE_URL}/upload", headers=headers, files=files)
            res.raise_for_status()
            song_id = res.json()['song_id']
            print(f"   Upload successful. Song ID: {song_id}")
    except Exception as e:
        print(f"Upload failed: {e}")
        if hasattr(e, 'response'):
             print(f"Response: {e.response.text}")
        return

    # 3. Poll Status
    print("3. Polling status...")
    for i in range(10):
        res = requests.get(f"{BASE_URL}/songs", headers=headers)
        songs = res.json()
        target_song = next((s for s in songs if s['id'] == song_id), None)
        
        if target_song:
            print(f"   Status: {target_song['status']}")
            if target_song['status'] == 'ready':
                print("   Processing complete!")
                print(f"   Instrumental URL: {target_song['instrumental_url']}")
                break
            elif target_song['status'] == 'error':
                print("   Processing failed (expected if Demucs not installed/configured in this env).")
                break
        
        time.sleep(2)

if __name__ == "__main__":
    test_flow()
