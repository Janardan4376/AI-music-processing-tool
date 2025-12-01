import os
from flask import Flask

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'backend', 'media')

# Simulate what's in the DB (based on audio_processor.py)
# output_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'instrumentals')
# instrumental_path = os.path.join(output_dir, 'htdemucs', base_name, 'no_vocals.wav')

# Let's create a fake path
base_name = "test_song"
instrumental_path = os.path.join(app.config['UPLOAD_FOLDER'], 'instrumentals', 'htdemucs', base_name, 'no_vocals.wav')

print(f"Upload Folder: {app.config['UPLOAD_FOLDER']}")
print(f"Instrumental Path: {instrumental_path}")

try:
    rel_path = os.path.relpath(instrumental_path, app.config['UPLOAD_FOLDER'])
    print(f"Rel Path: {rel_path}")
    print(f"URL: /api/media/{rel_path}")
except Exception as e:
    print(f"Error: {e}")
