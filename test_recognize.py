"""
Test script for face recognition API.
This script demonstrates how to test the /recognize endpoint.
"""
import requests
import os

# API base URL
BASE_URL = "http://localhost:5000"

def test_recognize(image_path):
    """
    Test the /recognize endpoint with an image.
    """
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    print(f"\n🔄 Testing face recognition with: {image_path}")
    
    with open(image_path, 'rb') as image_file:
        files = {'image': image_file}
        response = requests.post(f"{BASE_URL}/recognize", files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get("recognized"):
            print("✅ Face recognized!")
            print(f"   Name: {data['user']['name']}")
            print(f"   Student ID: {data['user']['student_id']}")
            print(f"   Confidence: {data['confidence']:.4f} (threshold: >0.7)")
        else:
            print("❌ Face detected but not recognized")
    elif response.status_code == 404:
        data = response.json()
        print("❌ No matching face found in database")
        if 'confidence' in data:
            print(f"   Best match confidence: {data['confidence']:.4f} (threshold: >0.7)")
    else:
        print("❌ Error occurred")
    print()


if __name__ == "__main__":
    # Test with an image
    test_image = "images/tai3.png"
    
    print("=" * 60)
    print("FACE RECOGNITION TEST")
    print("=" * 60)
    
    # You can add more test images here
    test_recognize(test_image)
    
    print("=" * 60)
    print("Test completed!")
    print("=" * 60)

