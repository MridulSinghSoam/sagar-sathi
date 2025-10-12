from flask import Flask, request, render_template
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import datetime

app = Flask(__name__)
model = load_model('fish_disease_model.h5')

class_names = [
    "Bacterial Red disease",
    "Bacterial Aeromoniasis",
    "Bacterial gill disease",
    "Fungal Saprolegniasis",
    "Healthy Fish",
    "Parasitic diseases",
    "Viral diseases White tail disease"
]
MODEL_ACCURACY = 95.12
MAX_UPLOADS = 5
past_uploads = []

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction = None
    filename = None

    if request.method == 'POST':
        file = request.files['image']
        if file:
            os.makedirs('static/uploads', exist_ok=True)
            filepath = os.path.join('static/uploads', file.filename)
            file.save(filepath)
            img = image.load_img(filepath, target_size=(128, 128))
            img_array = image.img_to_array(img) / 255.0
            img_array = np.expand_dims(img_array, axis=0)
            pred = model.predict(img_array)
            predicted_class = class_names[np.argmax(pred)]
            prediction = predicted_class
            filename = f"uploads/{file.filename}"
            timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            past_uploads.append({
                'filename': filename,
                'result': prediction,
                'timestamp': timestamp
            })
            if len(past_uploads) > MAX_UPLOADS:
                past_uploads.pop(0)

    uploads_display = list(past_uploads)
    while len(uploads_display) < MAX_UPLOADS:
        uploads_display.append({'filename': None, 'result': None, 'timestamp': None})

    return render_template(
        'index.html',
        prediction=prediction,
        filename=filename,
        accuracy=MODEL_ACCURACY,
        num_diseases=len(class_names),
        diseases=class_names,
        past_uploads=uploads_display
    )

if __name__ == "__main__":
    app.run(debug=True)
