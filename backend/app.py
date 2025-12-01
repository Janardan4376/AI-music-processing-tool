import os
from flask import Flask, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from models import db
from routes import api_bp
from datetime import timedelta

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/karaoke_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt_dev_key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)  # Session lasts 30 days
    app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'media')
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload

    # Ensure media directories exist
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'uploads'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'instrumentals'), exist_ok=True)
    os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'recordings'), exist_ok=True)

    # Extensions
    CORS(app)
    db.init_app(app)
    Migrate(app, db)
    JWTManager(app)

    # Debug Logging
    @app.before_request
    def log_request_info():
        if request.path == '/api/upload':
            print('--- Incoming Upload Request ---')
            print(f'Headers: {request.headers}')
            print(f'Body Preview: {request.get_data(as_text=False)[:100]}')

    # Blueprints
    app.register_blueprint(api_bp, url_prefix='/api')

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
