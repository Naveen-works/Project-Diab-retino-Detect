
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image

app = Flask(__name__)
CORS(app)


model_path = r'retinopathy_model.h5'  
model = load_model(model_path,compile=False)


class_mapping = {0: "No_DR", 1: "Mild", 2: "Moderate", 3: "Severe", 4: "Proliferate_DR"}

def preprocess_image(image):
    """Preprocess the input image for model prediction."""
    image = image.resize((128, 128)) 
    image = np.array(image) / 255.0  
    image = np.expand_dims(image, axis=0)  
    return image

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.json:
        return jsonify({'error': 'No image provided'}), 400
    
    try:
        image_data = request.json['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

       
        input_image = preprocess_image(image)

        
        predictions = model.predict(input_image)
        predicted_class = np.argmax(predictions)
        confidence_value = round(float(np.max(predictions) * 100), 2)

        
        predicted_label = class_mapping[predicted_class]

        return jsonify({
            'predicted_class': predicted_label,
            'confidence': confidence_value,
            'success': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
