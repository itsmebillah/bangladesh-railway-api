from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "status": "ok",
        "service": "The Silent Listener",
        "message": "Backend is running"
    })

@app.route("/health")
def health():
    return jsonify({"health": "good"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
