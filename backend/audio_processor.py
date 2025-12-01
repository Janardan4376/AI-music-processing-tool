import os
import json
import whisper
from spleeter.separator import Separator
from models import db, Song

# Initialize models globally to avoid reloading (optional, can be lazy loaded)
# separator = Separator('spleeter:2stems')
# whisper_model = whisper.load_model("base")

import subprocess

def process_song_task(song_id, filepath, app):
    """
    Background task to remove vocals using Demucs (High Quality) and extract lyrics.
    """
    with app.app_context():
        song = Song.query.get(song_id)
        try:
            # 1. Vocal Separation using Demucs
            output_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'instrumentals')
            os.makedirs(output_dir, exist_ok=True)
            
            # Check if demucs is installed
            try:
                subprocess.run(["demucs", "--help"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            except (subprocess.CalledProcessError, FileNotFoundError):
                raise RuntimeError("Demucs is not installed or not in PATH")

            # Run Demucs command
            # -n htdemucs: High quality model
            # --two-stems=vocals: Separate into vocals and non-vocals (instrumental)
            cmd = [
                "demucs", 
                "-n", "htdemucs", 
                "--two-stems=vocals", 
                filepath, 
                "-o", output_dir
            ]
            
            print(f"Running Demucs: {' '.join(cmd)}")
            
            # Use Popen to capture output in real-time
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT, 
                text=True, 
                bufsize=1, 
                universal_newlines=True
            )
            
            # Parse progress
            for line in process.stdout:
                print(f"Demucs Output: {line.strip()}") # Log for debugging
                if "%" in line:
                    try:
                        # Example line:  16%|█▌        | 12.6M/80.2M [00:00<00:02, 25.2MB/s]
                        # Extract percentage
                        parts = line.split('%')
                        if parts:
                            percentage = int(parts[0].strip().split()[-1])
                            # Update DB only if changed significantly to avoid too many writes
                            if percentage > song.progress:
                                song.progress = percentage
                                db.session.commit()
                    except Exception as e:
                        print(f"Error parsing progress: {e}")
            
            process.wait()
            
            if process.returncode != 0:
                print(f"Demucs failed with return code {process.returncode}")
                raise RuntimeError(f"Demucs failed with return code {process.returncode}")
            
            # Construct expected path
            # Demucs output structure: output_dir/htdemucs/filename_no_ext/no_vocals.wav
            base_name = os.path.splitext(os.path.basename(filepath))[0]
            
            # Handle potential spaces or special chars in filename that Demucs might sanitize
            # But for now, let's try the standard path first
            instrumental_path = os.path.join(output_dir, 'htdemucs', base_name, 'no_vocals.wav')
            
            if not os.path.exists(instrumental_path):
                # Fallback: look for any .wav file in the expected folder if exact match fails
                expected_folder = os.path.join(output_dir, 'htdemucs', base_name)
                if os.path.exists(expected_folder):
                    wavs = [f for f in os.listdir(expected_folder) if f.endswith('no_vocals.wav')]
                    if wavs:
                        instrumental_path = os.path.join(expected_folder, wavs[0])
                    else:
                         raise FileNotFoundError(f"No instrumental output found in {expected_folder}")
                else:
                    raise FileNotFoundError(f"Demucs output folder not found at {expected_folder}")
            
            # 2. Lyrics Extraction
            # Using Whisper (medium model for better multilingual support)
            model = whisper.load_model("medium")
            result = model.transcribe(filepath)
            
            lyrics_data = []
            for segment in result['segments']:
                lyrics_data.append({
                    'start': segment['start'],
                    'end': segment['end'],
                    'text': segment['text'].strip()
                })
            
            # Update DB
            song.instrumental_path = instrumental_path
            song.lyrics_json = json.dumps(lyrics_data)
            song.status = 'ready'
            db.session.commit()
            print(f"Processing complete for song {song_id}")
            
        except Exception as e:
            print(f"Error processing song {song_id}: {e}")
            song.status = 'error'
            db.session.commit()
