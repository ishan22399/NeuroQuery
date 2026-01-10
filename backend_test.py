import requests
import sys
import json
import time
from datetime import datetime
from pathlib import Path
import tempfile

class NeuroQueryAPITester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.uploaded_doc_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_document_upload(self):
        """Test document upload with a small text file"""
        # Create a small test text file
        test_content = """
        NeuroQuery Test Document
        
        This is a test document for the NeuroQuery RAG system.
        It contains information about artificial intelligence and machine learning.
        
        Key concepts:
        - Natural Language Processing (NLP)
        - Vector embeddings
        - Retrieval-Augmented Generation (RAG)
        - Semantic search
        
        The system should be able to answer questions about these topics
        based on this document content.
        """
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_document.txt', f, 'text/plain')}
                success, response = self.run_test(
                    "Document Upload", 
                    "POST", 
                    "documents/upload", 
                    200, 
                    files=files
                )
                
                if success and 'id' in response:
                    self.uploaded_doc_id = response['id']
                    print(f"   Document ID: {self.uploaded_doc_id}")
                    return True
                return False
        finally:
            # Clean up temp file
            Path(temp_file_path).unlink(missing_ok=True)

    def test_get_documents(self):
        """Test getting all documents"""
        success, response = self.run_test("Get Documents", "GET", "documents", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} documents")
            return True
        return False

    def test_query_simple(self):
        """Test simple query"""
        if not self.uploaded_doc_id:
            print("❌ Skipping query test - no uploaded document")
            return False
            
        query_data = {
            "query": "What is RAG?",
            "mode": "detailed"
        }
        
        success, response = self.run_test("Simple Query", "POST", "query", 200, data=query_data)
        if success:
            print(f"   Answer length: {len(response.get('answer', ''))}")
            print(f"   Citations: {len(response.get('citations', []))}")
            print(f"   Faithfulness: {response.get('faithfulness_score', 0)}")
            print(f"   Refused: {response.get('refused', False)}")
            return True
        return False

    def test_query_modes(self):
        """Test different query modes"""
        if not self.uploaded_doc_id:
            print("❌ Skipping query modes test - no uploaded document")
            return False
            
        modes = ['concise', 'detailed', 'research']
        all_passed = True
        
        for mode in modes:
            query_data = {
                "query": "What are the key concepts mentioned?",
                "mode": mode
            }
            
            success, response = self.run_test(f"Query Mode: {mode}", "POST", "query", 200, data=query_data)
            if not success:
                all_passed = False
            else:
                print(f"   Mode {mode} - Answer length: {len(response.get('answer', ''))}")
        
        return all_passed

    def test_query_with_document_filter(self):
        """Test query with document ID filter"""
        if not self.uploaded_doc_id:
            print("❌ Skipping filtered query test - no uploaded document")
            return False
            
        query_data = {
            "query": "What is NLP?",
            "mode": "detailed",
            "document_ids": [self.uploaded_doc_id]
        }
        
        success, response = self.run_test("Filtered Query", "POST", "query", 200, data=query_data)
        if success:
            print(f"   Citations from filtered doc: {len(response.get('citations', []))}")
            return True
        return False

    def test_get_document_chunks(self):
        """Test getting document chunks"""
        if not self.uploaded_doc_id:
            print("❌ Skipping chunks test - no uploaded document")
            return False
            
        success, response = self.run_test(
            "Get Document Chunks", 
            "GET", 
            f"documents/{self.uploaded_doc_id}/chunks", 
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} chunks")
            return True
        return False

    def test_delete_document(self):
        """Test document deletion"""
        if not self.uploaded_doc_id:
            print("❌ Skipping delete test - no uploaded document")
            return False
            
        success, response = self.run_test(
            "Delete Document", 
            "DELETE", 
            f"documents/{self.uploaded_doc_id}", 
            200
        )
        return success

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test empty query
        empty_query = {"query": "", "mode": "detailed"}
        success, _ = self.run_test("Empty Query", "POST", "query", 400, data=empty_query)
        
        # Test invalid document ID
        invalid_chunks = self.run_test("Invalid Doc Chunks", "GET", "documents/invalid-id/chunks", 200)
        
        # Test invalid file upload (if we had one)
        return success

def main():
    print("🚀 Starting NeuroQuery API Tests")
    print("=" * 50)
    
    tester = NeuroQueryAPITester()
    
    # Run all tests
    tests = [
        tester.test_api_root,
        tester.test_document_upload,
        tester.test_get_documents,
        tester.test_query_simple,
        tester.test_query_modes,
        tester.test_query_with_document_filter,
        tester.test_get_document_chunks,
        tester.test_error_cases,
        tester.test_delete_document,  # Delete last to clean up
    ]
    
    for test in tests:
        try:
            test()
            time.sleep(1)  # Brief pause between tests
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())