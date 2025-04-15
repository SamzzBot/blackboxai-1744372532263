from flask import Flask, jsonify, request, send_from_directory
import json
import os
import string
import random
import time
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# Ensure the data directory exists
DATA_DIR = Path('data')
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE = DATA_DIR / 'links.json'

# Initialize empty data file if it doesn't exist
if not DATA_FILE.exists():
    with open(DATA_FILE, 'w') as f:
        json.dump({"links": {}}, f)

def load_data():
    """Load data from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading data: {e}")
        return {"links": {}}

def save_data(data):
    """Save data to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving data: {e}")

def generate_tracking_code(length=6):
    """Generate a random tracking code"""
    chars = string.ascii_letters + string.digits
    while True:
        code = ''.join(random.choice(chars) for _ in range(length))
        if code not in load_data()['links']:
            return code

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/links', methods=['GET'])
def get_links():
    """Get all tracking links"""
    data = load_data()
    links_list = []
    for code, link_data in data['links'].items():
        link_data['trackingCode'] = code
        link_data['trackingUrl'] = f"{request.host_url}track.html?code={code}"
        links_list.append(link_data)
    return jsonify(sorted(links_list, key=lambda x: x['createdAt'], reverse=True))

@app.route('/api/links', methods=['POST'])
def create_link():
    """Create a new tracking link"""
    data = load_data()
    
    # Validate input
    if not request.json or 'destinationUrl' not in request.json:
        return jsonify({"error": "Destination URL is required"}), 400
    
    destination_url = request.json['destinationUrl']
    custom_alias = request.json.get('customAlias')
    
    # Validate custom alias if provided
    if custom_alias:
        if custom_alias in data['links']:
            return jsonify({"error": "Custom alias already exists"}), 400
        tracking_code = custom_alias
    else:
        tracking_code = generate_tracking_code()
    
    # Create new link entry
    data['links'][tracking_code] = {
        'destinationUrl': destination_url,
        'createdAt': datetime.utcnow().isoformat(),
        'visits': []
    }
    
    save_data(data)
    
    return jsonify({
        'trackingCode': tracking_code,
        'trackingUrl': f"{request.host_url}track.html?code={tracking_code}"
    })

@app.route('/api/links/<tracking_code>', methods=['GET'])
def get_link(tracking_code):
    """Get details for a specific tracking link"""
    data = load_data()
    
    if tracking_code not in data['links']:
        return jsonify({"error": "Link not found"}), 404
    
    link_data = data['links'][tracking_code]
    link_data['trackingCode'] = tracking_code
    return jsonify(link_data)

@app.route('/api/track/<tracking_code>', methods=['POST'])
def track_visit(tracking_code):
    """Record a visit to a tracking link"""
    data = load_data()
    
    if tracking_code not in data['links']:
        return jsonify({"error": "Link not found"}), 404
    
    # Create visit record
    visit = {
        'timestamp': datetime.utcnow().isoformat(),
        'ip': request.remote_addr,
        'userAgent': request.headers.get('User-Agent'),
    }
    
    # Add location data if provided
    if request.json:
        visit.update({
            'latitude': request.json.get('latitude'),
            'longitude': request.json.get('longitude'),
            'accuracy': request.json.get('accuracy'),
            'locationDenied': request.json.get('locationDenied', False)
        })
    
    # Add visit to link data
    data['links'][tracking_code]['visits'].append(visit)
    save_data(data)
    
    return jsonify({
        'success': True,
        'destinationUrl': data['links'][tracking_code]['destinationUrl']
    })

@app.route('/api/analytics/<tracking_code>', methods=['GET'])
def get_analytics(tracking_code):
    """Get analytics for a specific tracking link"""
    data = load_data()
    
    if tracking_code not in data['links']:
        return jsonify({"error": "Link not found"}), 404
    
    link_data = data['links'][tracking_code]
    link_data['trackingCode'] = tracking_code
    return jsonify(link_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
