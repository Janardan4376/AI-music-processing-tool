from flask import Blueprint, request, jsonify, current_app, send_from_directory
from models import db, User, Song, Recording
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import os
import threading
from audio_processor import process_song_task
from datetime import datetime
import subprocess

api_bp = Blueprint('api', __name__)

# --- Auth Routes ---
@api_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400
        
    # Generate username from email (part before @)
    username = email.split('@')[0]
    
    user = User(email=email, username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'token': access_token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({'token': access_token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})
        
    return jsonify({'error': 'Invalid credentials'}), 401

@api_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({'id': user.id, 'username': user.username})

# --- Song Routes ---
@api_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_song():
    print("Upload request received")
    print(f"Headers: {request.headers}")
    print(f"Files: {request.files}")
    
    if 'file' not in request.files:
        print("Error: No file part")
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    current_user_id = get_jwt_identity()
    print(f"User ID: {current_user_id}")
    
    if file.filename == '':
        print("Error: No selected file")
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # Create user specific folder
        user_upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'uploads', str(current_user_id))
        os.makedirs(user_upload_dir, exist_ok=True)
        
        filename = f"{datetime.now().timestamp()}_{file.filename}"
        filepath = os.path.join(user_upload_dir, filename)
        try:
            file.save(filepath)
        except Exception as e:
            print(f"Error saving file: {e}")
            return jsonify({'error': 'Failed to save file'}), 500
        
        new_song = Song(
            title=file.filename, 
            filename=filename, 
            user_id=current_user_id,
            status='processing'
        )
        db.session.add(new_song)
        db.session.commit()
        
        # Start background processing
        thread = threading.Thread(target=process_song_task, args=(new_song.id, filepath, current_app._get_current_object()))
        thread.start()
        
        return jsonify({'message': 'Upload successful, processing started', 'song_id': new_song.id})

@api_bp.route('/songs', methods=['GET'])
@jwt_required()
def get_songs():
    current_user_id = get_jwt_identity()
    songs = Song.query.filter_by(user_id=current_user_id).order_by(Song.upload_date.desc()).all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'status': s.status,
        'instrumental_url': f"/api/media/{os.path.relpath(s.instrumental_path, current_app.config['UPLOAD_FOLDER'])}" if s.instrumental_path else None,
        'lyrics': s.lyrics_json,
        'upload_date': s.upload_date.isoformat(),
        'progress': s.progress
    } for s in songs])

@api_bp.route('/songs/<int:song_id>', methods=['DELETE'])
@jwt_required()
def delete_song(song_id):
    current_user_id = get_jwt_identity()
    song = Song.query.filter_by(id=song_id, user_id=current_user_id).first()
    db.session.delete(song)
    db.session.commit()
    # TODO: Delete actual files to save space
    return jsonify({'message': 'Song deleted'})

@api_bp.route('/recordings', methods=['GET'])
@jwt_required()
def get_recordings():
    current_user_id = get_jwt_identity()
    recordings = Recording.query.filter_by(user_id=current_user_id).order_by(Recording.created_at.desc()).all()
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'filename': r.filename,
        'url': f"/api/media/recordings/{r.filename}",
        'created_at': r.created_at.isoformat(),
        'duration': r.duration
    } for r in recordings])

@api_bp.route('/recordings/<int:rec_id>', methods=['DELETE'])
@jwt_required()
def delete_recording(rec_id):
    current_user_id = get_jwt_identity()
    recording = Recording.query.filter_by(id=rec_id, user_id=current_user_id).first()
    if not recording:
        return jsonify({'error': 'Recording not found'}), 404
        
    db.session.delete(recording)
    db.session.commit()
    
    # Try to delete the file
    try:
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'recordings', recording.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
        
    return jsonify({'message': 'Recording deleted'})

@api_bp.route('/recordings', methods=['POST'])
@jwt_required()
def save_recording():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    song_id = request.form.get('song_id')
    current_user_id = get_jwt_identity()
    
    if file:
        user_rec_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'recordings')
        os.makedirs(user_rec_dir, exist_ok=True)
        
        filename = f"rec_{current_user_id}_{datetime.now().timestamp()}.webm"
        filepath = os.path.join(user_rec_dir, filename)
        file.save(filepath)
        
        # Mix with instrumental if song_id is provided
        final_filename = filename
        
        # 1. Denoise the vocal recording first
        try:
            denoised_filename = f"denoised_{filename}"
            denoised_filepath = os.path.join(user_rec_dir, denoised_filename)
            
            # FFmpeg command for noise removal and enhancement
            # highpass=f=80: Remove rumble
            # afftdn=nf=-25: Denoise (noise floor -25dB)
            # dynaudnorm: Normalize volume
            denoise_cmd = [
                "ffmpeg",
                "-i", filepath,
                "-af", "highpass=f=80,afftdn=nf=-25,dynaudnorm",
                "-y",
                denoised_filepath
            ]
            print(f"Denoising audio: {' '.join(denoise_cmd)}")
            subprocess.run(denoise_cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            if os.path.exists(denoised_filepath):
                # Use the denoised file for mixing
                filepath = denoised_filepath 
                # We keep the original filename variable for DB, but point filepath to the clean version
        except Exception as e:
            print(f"Error denoising audio: {e}")
            # Continue with original file if denoising fails

        if song_id:
            song = Song.query.get(song_id)
            if song and song.instrumental_path and os.path.exists(song.instrumental_path):
                try:
                    mixed_filename = f"mixed_{filename.replace('.webm', '.mp3')}"
                    mixed_filepath = os.path.join(user_rec_dir, mixed_filename)
                    
                    # FFmpeg command to mix audio
                    # -i instrumental -i vocal (now denoised)
                    cmd = [
                        "ffmpeg",
                        "-i", song.instrumental_path,
                        "-i", filepath,
                        "-filter_complex", "amix=inputs=2:duration=shortest",
                        "-y",
                        mixed_filepath
                    ]
                    print(f"Mixing audio: {' '.join(cmd)}")
                    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    
                    # If successful, use the mixed file
                    if os.path.exists(mixed_filepath):
                        final_filename = mixed_filename
                except Exception as e:
                    print(f"Error mixing audio: {e}")
                    # Fallback to original (or denoised) recording if mixing fails
        
        new_rec = Recording(
            title=f"Recording {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            filename=final_filename,
            song_id=song_id,
            user_id=current_user_id
        )
        db.session.add(new_rec)
        db.session.commit()
        return jsonify({'message': 'Recording saved'})
    return jsonify({'error': 'Save failed'}), 500

# --- Media Serving ---
@api_bp.route('/media/<path:filename>')
def serve_media(filename):
    # Security check: ensure we don't traverse up
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@api_bp.route('/stream/<int:song_id>/accompaniment')
def stream_accompaniment(song_id):
    song = Song.query.get_or_404(song_id)
    if not song.instrumental_path or not os.path.exists(song.instrumental_path):
        return jsonify({'error': 'Instrumental not found'}), 404
    
    # Determine directory and filename
    directory = os.path.dirname(song.instrumental_path)
    filename = os.path.basename(song.instrumental_path)
    
    return send_from_directory(directory, filename)
